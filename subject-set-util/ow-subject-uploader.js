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
  .option('run', {
    demand: true,
    choices: ['getSubjectsInSet', 'createLinkedListInSet', 'updateSubjectsInSet']
  })
  .option('project', {
    demand: true,
    describe: 'Project ID',
    type: 'integer'
  })
  .option('subject-set', {
    demand: true,
    describe: 'Subject set ID',
    type: 'integer'
  })
  .option('prompt', {
    describe: 'Prompt for username/password. Checks ENV for user/pass by default',
    default: false,
    type: 'boolean'
  })
  .argv;

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

  console.log('Using credentials: ', credentials);

  auth.signIn(credentials).then(() => {
    console.log('User logged in sucessfully!');
  });


});




return;




const OW_STAGING_PROJECT_ID = 195;
const subjectSetType = api.type('subject_sets');
const subjectType = api.type('subjects');

// var newSubjects = require('./bear-data.json');

// use limited number of subjects
// newSubjects = [ newSubjects[0], newSubjects[1], newSubjects[2], newSubjects[3] ];

var subjects = require('./bear-data-staging-linked.json');
// subjects = [ subjects[0], subjects[1], subjects[2], subjects[3], subjects[4] ];


// auth.signIn(credentials).then(() => {
//   console.log('User logged in sucessfully!');
//
//   // dumpSubjectSet(3776);
//
//   // var newSubjects = addNextLinksToSubjectSet(subjects);
//   // console.log('NEW SUBJECTS: ', JSON.stringify(newSubjects) );
//
//   // >>> update subjects >>>
//   async.forEachOfSeries(subjects, updateSubjectMetadata,
//     function(err) {
//       if (err) { console.log('ERROR: ', err); }
//       console.log('DONE');
//   });
//   // <<< update subjects <<<`
//
//
//   // // >>> update subject sets >>>
//   // api.type('subject_sets').get({id: '3776'}).update({metadata:{active: 'true', shortName: 'The Other Bear'}}).save()
//   //   .catch( function(err) {
//   //     console.log('ERROR: ', err);
//   //   })
//   //   .then( function(res) {
//   //     console.log('Requested Subject(s): ', res);
//   //   });
//   // // <<< update subject sets <<<
//
//   // // >>> upload subjects >>>
//   // async.forEachOfSeries(newSubjects, uploadSubject,
//   //   function(err) {
//   //     if (err) { console.log('ERROR: ', err); }
//   //     console.log('DONE');
//   // });
//   // // <<< upload subjects <<<`
//
// });


function updateSubjectMetadata(subject, index, callback) {
  console.log('Updating page ', index);

  // console.log('SUBJECT: ', subject);

  // subject.metadata;

  api.type('subjects').get({id: subject.id}).update({
    locations: subject.locations,
    metadata: subject.metadata
  }).save()
    .then( function(newSubject) {
      // console.log('UPDATED SUBJECT: ', newSubject);
      // console.log("ZOONIVERSE_ID", subject.toJSON().id );
      console.log('Finished updating.');
      callback(null);
    })
    .catch(function(error) {
     console.log("Error updating subject data! ", error);
     callback(error);
    //  process.exit(1);
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

/* DUMP SUBJECT SET */
function dumpSubjectSet(subjectSetId) {
  console.log('Dumping all subjects sets...');

  getAllSubjectsInSet(subjectSetId)
    .catch( function(err) { console.log('ERROR: ', err) })
    .then( function(subjects) {
      console.log('SUBJECTS: ', subjects);
      // var subjects = subjects;
      // newSubjects = addNextLinksToSubjectSet(subjects);
      console.log('SUBJECTS = ', JSON.stringify(subjects) );
      console.log(JSON.stringify(newSubjects) ); // print out subjects
  });

}

function addNextLinksToSubjectSet(subjects) {
  console.log('Adding Next Links to Subject Set: ', subjects);

  // return;

  // Filter subjects without page number, then sort by ship & page number
  subjects = subjects.filter(subject => typeof subject.metadata.pageNumber !== 'undefined')
    .sort((subject1, subject2) => {
      if( parseInt(subject1.metadata.pageNumber) > parseInt(subject2.metadata.pageNumber) ) {
        return 1;
      }
      if( parseInt(subject1.metadata.pageNumber) < parseInt(subject2.metadata.pageNumber) ) {
        return -1;
      }
      else {
        return 0;
      }
    });

    subjects.map((subject, i) => {

      subject.metadata.prevSubjectId = null;
      subject.metadata.nextSubjectId = null;

      const prevSubject = subjects[i-1];
      if (prevSubject) {
        subject.metadata.prevSubjectId = prevSubject.id;
      }
      const nextSubject = subjects[i + 1];
      if (nextSubject) { //&& nextSubject.subject_set_id === subject.subject_set_id) {
        subject.metadata.nextSubjectId = nextSubject.id;
      }
      // return subject;
    });

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
    });;
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
