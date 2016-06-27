/*******************************************************************************
 *  DESCRIPTION: Enables fetching sequential subjects from Panoptes API by
 *  creating a linked-list in an existing subject set. The user must 1) have a
 *  Zooniverse acount; 2) permissions (either as an owner or collaborator) to a
 *  Zooniverse project, and 3) an existing subject set linked to the project.
 *******************************************************************************/


'use strict';
const api    = require('panoptes-client');
const auth   = require('panoptes-client/lib/auth');
const async  = require('async');
const prompt = require('prompt');
const argv   = require('yargs')
  .usage('Usage: $0 --project [project_id] --subject-set [subject-set-id]')
  .option('link-pages', {
    alias: 'l',
    describe: 'Creates linked list among in subject set to support sequential pages',
    type: 'boolean'
  })
  .option('project', {
    alias: 'p',
    demand: true,
    describe: 'Project ID',
    type: 'integer'
  })
  .option('subject-set', {
    alias: 's',
    demand: true,
    describe: 'Subject set ID',
    type: 'integer'
  })
  .option('env', {
    describe: 'Sets run environment',
    default: 'staging',
    choices: ['staging', 'development', 'production']
  })
  .option('active', {
    describe: 'Updates subject set "active" property; "false" will take the subject set offline',
    // type: 'boolean'
  })
  .option('short-name', {
    describe: 'Updates subject set "shortName" property',
    type: 'string'
  })
  .check( function(argv) {
    if (typeof argv.shortName == 'boolean') {
      throw 'Option "shortName" must have a string value';
    }
    return true;
  })
  .option('prompt', {
    describe: 'Prompt for username/password. Checks ENV for user/pass by default',
    default: false,
    type: 'boolean'
  })
  .implies('active', 'short-name')
  .implies('short-name', 'active')
  .epilogue('Copyright 2016 Zooniverse')
  .wrap(null)
  .argv;

console.log('Setting Node environment to "%s"', argv.env);

// delete credentials from ENV when requesting prompt
if(argv.prompt) {
  delete process.env.PANOPTES_USERNAME;
  delete process.env.PANOPTES_PASSWORD;
}

// skip prompt if credentials are found in ENV
prompt.override = {
  login: process.env.PANOPTES_USERNAME,
  password: process.env.PANOPTES_PASSWORD
};

prompt.start();

prompt.get({
  properties: {
    login: {
      pattern: /^[a-zA-Z\s\-]+$/,
      message: 'Name must be only letters, spaces, or dashes',
      required: true
    },
    password: {
      hidden: true
    }
  }
}, function(error, result) {
  if (error) {
    console.log(error);
  }

  // set acquired credentials
  let credentials = result;

  // For debugging...
  // console.log('Using credentials: ', credentials);
  // console.log('Argv = ', argv);

  auth.signIn(credentials).then(() => {

    // create a linked-list in subject set
    if (argv.linkPages) {
      getAllSubjectsInSet(argv.subjectSet).then( function(subjects) {
        var updatedSubjects = addNextLinksToSubjectSet(subjects);
        async.forEachOfSeries(updatedSubjects, updateSubjectMetadata,
          function(err) {
            if (err) { console.log('ERROR: ', err); }
            console.log('DONE');
        });
      });
    }

    // change "active" status of subject set
    else if (typeof argv.active !== "undefined" && argv.active !== null) {
      console.log('Updating subject set status...');
      updateSubjectSetActiveStatus();
    }

    else {
      getSubjectSet();
    }


/*  STILL NEED TO WORK THIS CODE IN:

    // >>> update subjects >>>
    async.forEachOfSeries(subjects, updateSubjectMetadata,
      function(err) {
        if (err) { console.log('ERROR: ', err); }
        console.log('DONE');
    });
    // <<< update subjects <<<`


    // >>> update subject sets >>>
    api.type('subject_sets').get({id: '3776'}).update({metadata:{active: 'true', shortName: 'The Other Bear'}}).save()
      .catch( function(err) {
        console.log('ERROR: ', err);
      })
      .then( function(res) {
        console.log('Requested Subject(s): ', res);
      });
    // <<< update subject sets <<<


    // >>> upload subjects >>>
    async.forEachOfSeries(newSubjects, uploadSubject,
      function(err) {
        if (err) { console.log('ERROR: ', err); }
        console.log('DONE');
    });
    // <<< upload subjects <<<`
*/


  });


});

// const OW_STAGING_PROJECT_ID = 195;
const subjectSetType = api.type('subject_sets');
const subjectType = api.type('subjects');

function getSubjectSet() {
  api.type('subject_sets').get({id: argv.subjectSet})
    .then( function(subject_set) {
      console.log('Retrieved Subject Set ', subject_set);
      callback(null);
    })
    .catch( function(error) {
     console.log("Error fetching subject set! ", error);
     callback(error);
   });

}

// updates an existing subject by replacing `locations` and `metadata` hashes
function updateSubjectMetadata(subject, index, callback) {
  console.log('Updating page ', index);
  api.type('subjects').get({id: subject.id}).update({
      // Note: we only need to send `locations` and `metadata` to update subject
      locations: subject.locations,
      metadata: subject.metadata
    })
    .save() // note: commenting keeps changes local
    .then( function(subject) {
      // console.log('Finished updating subject: ', subject);
      callback(null);
    })
    .catch( function(error) {
     console.log("Error updating subject data! ", error);
     callback(error);
   });
}

function uploadSubject(subject, index, callback) {
  console.log('Uploading page ', index);

  let newSubject = {
    locations: subject.locations,
    metadata: subject.metadata,
    links: {
      project: argv.project,
      subject_sets: [argv.subjectSet],
    }
  }
  api.type('subjects').create(newSubject).save()
    .then( function(newSubject) {
      // console.log("ZOONIVERSE_ID", subject.toJSON().id );
      console.log('Finished uploading.');
      callback(null);
    })
    .catch(function(error) {
     console.log("Error saving subject data! ", error);
     callback(error);
    //  process.exit(1);
   });

}

function updateSubjectSetActiveStatus() {
  let shortName = argv.shortName ? argv.shortName :  '';
  api.type('subject_sets').get({id: argv.subjectSet}).update({metadata:{active: argv.active, shortName: shortName}}).save()
    .catch( function(err) {
      console.log('ERROR: ', err);
    })
    // // DEBUG CODE
    // .then( function(res) {
    //   console.log('Requested Subject(s): ', res);
    // });
}


function addNextLinksToSubjectSet(subjects) {
  console.log('Adding Next Links to Subject Set');

  subjects = subjects

    // skip subjects missing page number
    .filter(subject => {
      var hasPageNumber = (typeof subject.metadata.pageNumber !== 'undefined' && subject.metadata.pageNumber !== null);
      if (!hasPageNumber) {
        console.log('Warning: Skipped subject (' + subject.id + '); missing metadata.pageNumber');
      }
      return hasPageNumber;
    })

    // sort by page number
    .sort((subject1, subject2) => {
      let page1 = parseInt(subject1.metadata.pageNumber),
          page2 = parseInt(subject2.metadata.pageNumber);
      if( page1 > page2 ) { return 1; }
      if( page1 < page2 ) { return -1; }
      else { return 0; }
    })

    // add next/prev subject ids
    .map((subject, i) => {
      subject.metadata.prevSubjectId = null; // TO DO: maybe make this into an array?
      subject.metadata.nextSubjectId = null;
      const prevSubject = subjects[i-1];
      const nextSubject = subjects[i+1];
      if (prevSubject) { subject.metadata.prevSubjectId = prevSubject.id; }
      if (nextSubject) { subject.metadata.nextSubjectId = nextSubject.id; }
      return subject;
    });

  // console.log('NEW SUBJECTS = ', subjects);
  return subjects;
}

function addNextLinks(subjects) {

  // Filter subjects without page number, then sort by ship & page number
  subjects = subjects

    .filter(subject => typeof subject.metadata.pageNumber !== 'undefined')

    .sort((subject1, subject2) => {
      const ssdiff = subject1.subject_set_id - subject2.subject_set_id;
      if (ssdiff === 0) {
        return subject1.metadata.pageNumber - subject2.metadata.pageNumber;
      } else {
        return ssdiff;
      }
    });

  // Add next subject id to metadata of each subject
  subjects = subjects

    .map((subject, i) => {
      const nextSubject = subjects[i + 1];
      if (nextSubject && nextSubject.subject_set_id === subject.subject_set_id) {
        subject.metadata.nextSubjectId = nextSubject.id
      }
      return subject;
    });

  return subjects;
}

function getAllSubjectsInSet(subjectSetId) {
  const query = { subject_set_id: subjectSetId, page: 1 };
  return subjectType.get(query)
    .then(subjects => {
      const numPages = subjects[0]._meta.subjects.page_count;
      const pageFetches = [Promise.resolve(subjects)];
      for (let i = 2; i <= numPages - 1; i++) {
        let fetcher = subjectType.get(Object.assign({}, query, { page: i }));
        pageFetches.push(fetcher);
      }
      return Promise.resolve(pageFetches);
    })
    .then(pageFetches => {
      return Promise.all(pageFetches);
    })
    .then(subjectPages => {
      const subjects = [];
      for (let subjectPage of subjectPages) {
        subjects.push.apply(subjects, subjectPage);
      }
      return Promise.resolve(subjects);
    })
    .catch( function(err){
      console.log('ERROR: ', err);
    });
}

function getAllSubjectsInProject(projectId) {
  // Sign in
  return auth
    .signIn(credentials)
    // Get all subject sets in projecy
    .then(() => {
      return subjectSetType.get({ project_id: projectId })
    })
    // Get all subjects from subject sets
    .then((subjectSets) => {
      return Promise.all(subjectSets.map(subjectSet => getAllSubjectsInSet(subjectSet.id)));
    })
    //
    .then(subjectSetSubjects => {
      // Flatten subjects grouped by set to one list
      const subjects = [];
      subjectSetSubjects.forEach(subjs => {
        subjects.push.apply(subjects, subjs);
      });
      return Promise.resolve(subjects);
    })
    .catch(err => console.error('err', err));
}

// Generate random page numbers for staging subjects (they don't have any currently)
function addRandomPageNumbersToSubjects() {
  return getAllSubjectsInProject(OW_STAGING_PROJECT_ID)
    .then(subjects => {
      const usedPageNums = [];
      const savePromises = [];
      subjects.forEach((subject, i) => {
        let pageNum = Math.round(Math.random() * 50);
        while(usedPageNums.indexOf(pageNum) > -1) {
          let pageNum = Math.round(Math.random() * 50);
        }
        subject.metadata.pageNumber = pageNum;
        savePromises.push(subject.save());
      });

      Promise.all(savePromises)
        .then(savedSubjects => {
          console.log('Success!', savedSubjects);
        })
        .catch(err => {
          console.log('Error!', err);
        });
    });
}

// addRandomPageNumbersToSubjects();
