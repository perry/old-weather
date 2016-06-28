/*******************************************************************************
 *  DESCRIPTION: Enables fetching sequential subjects from Panoptes API by
 *  creating a linked-list in an existing subject set. The user must 1) have a
 *  Zooniverse acount; 2) permissions (either as an owner or collaborator) to a
 *  Zooniverse project, and 3) an existing subject set linked to the project.
 *******************************************************************************/


'use strict';
const api    = require('panoptes-client');
const auth   = require('panoptes-client/lib/auth');

// const subjectSetType = api.type('subject_sets');
// const subjectType = api.type('subjects');


const async  = require('async');
const prompt = require('prompt');
const argv   = require('yargs')
  .usage('Usage: $0 <command> [options]')
  .demand(1)
  .option('env', {
    describe: 'Sets run environment',
    default: 'staging',
    choices: ['staging', 'development', 'production']
  })
  .option('prompt', {
    describe: 'Prompt for username/password. Checks ENV for user/pass by default',
    default: false,
    type: 'boolean'
  })
  .command('list', 'List available subject sets', function (yargs) {
      return yargs
        .usage('Usage: $0 list')
        .option('project', {
          alias: 'p',
          demand: true,
          describe: 'Project ID',
          type: 'integer'
        })
        .help()
    }, function(argv) {
      console.log('HANDLING LISTING SUBJECT SETS... argv = ', argv);

      // getAllSubjectSets(argv.project).then( function(subjectSets) {
      //   console.log('SUBJECT SETS: ', subjectSets);
      // });


    })
  .command('link-pages', 'Creates a linked list amond subjects in a set to support sequential pages', function (yargs) {
      return yargs
        .usage('Usage: $0 link-pages --project [project_id] --subject-set [subject_set_id]')
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
    }, function(){
      console.log('HANDLING LINK-PAGES');
    })
  .command('update-status', 'Updates subject set status', function (yargs) {
      return yargs
      .usage('Usage: $0 update-status --project [project_id] --subject-set [subject_set_id] --active [active_status] --shortName [ship_name]')
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
      .option('active', {
        demand: true,
        describe: 'Updates subject set "active" property; "false" will take the subject set offline',
        // type: 'boolean'
      })
      .option('short-name', {
        demand: true,
        describe: 'Updates subject set "shortName" property',
        type: 'string'
      })
      .implies('active', 'short-name')
      .implies('short-name', 'active')
      .check( function(argv) {
        if (typeof argv.shortName == 'boolean') {
          throw 'Option "shortName" must have a string value';
        }
        return true;
      })
    }, function(){
      console.log('HANDLING UPDATE-STATUS');
    })
  // .help()
  .strict()
  .epilogue('Copyright 2016 Zooniverse')
  .wrap(null)
  .argv;
//
// console.log('ARGV: ', argv);
// console.log('FOO: ', argv['_']);
// return;

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

    switch(argv._[0]) {

      case 'list':
        getAllSubjectSets(argv.project).then( function(subjectSets) {
          console.log('\nID\tActive\tNo. Subjects\tShort Name\tDisplay Name');
          subjectSets.map( function(subjectSet) {
            console.log('%s\t%s\t%s\t%s\t%s', subjectSet.id, subjectSet.metadata.active, subjectSet.set_member_subjects_count, subjectSet.metadata.shortName, subjectSet.display_name);
          });
        });
        break;

      case 'link-pages':
        getAllSubjectsInSet(argv.subjectSet).then( function(subjects) {
          console.log('BEFORE:', subjects);
          let updatedSubjects = addNextLinksToSubjectSet(subjects);
          console.log('AFTER: ', updatedSubjects);
          if( updatedSubjects.length == 0 ) {
            console.log('No subjects to update.');
            process.exit();
          }
          prompt.message = 'Confirmation Required';
          prompt.start();
          prompt.get([{
            properties: {
              proceed: {
                description: 'This will modify ' + subjects.length + ' existing subjects. Are you sure? (y/n)'
              }
            }
          }], function(err, res) {
            if (res.proceed.match(/y/i)) {
              async.forEachOfSeries(updatedSubjects, updateSubjectMetadata,
                function(err) {
                  // if (err) { console.log('ERROR: ', err); }
                  console.log('Finished updating subjects.\nTip: Remember to add the subject set to the workflow.');
              });
            } else {
              console.log('Aborted.');
              process.exit();
            }
          })
        });
        break;

      case 'update-status':
        console.log('Updating status...');
        updateSubjectSetActiveStatus();
        break;

      default:
        console.log('BLAH');
        break;
    }

  });

});

function getSubjectSet() {
  api.type('subject_sets').get({id: argv.subjectSet})
    .then( function(subject_set) {
      // console.log('Retrieved Subject Set ', subject_set);
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
    .sort( (subject1, subject2) => { return parseInt(subject1.metadata.pageNumber) - parseInt(subject2.metadata.pageNumber) });

  // once sorted by page number, add next/prev subject ids to each subject
  subjects = subjects.map((subject, i) => {
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


function getAllSubjectSets(projectId) {
  const query = { project_id: projectId, page: 1 };
  return api.type('subject_sets').get(query)
    .then(subjectSets => {
      const numPages = subjectSets[0]._meta.subject_sets.page_count;
      const pageFetches = [Promise.resolve(subjectSets)];
      for (let i = 2; i <= numPages - 1; i++) {
        let fetcher = api.type('subject_sets').get(Object.assign({}, query, { page: i }));
        pageFetches.push(fetcher);
      }
      return Promise.resolve(pageFetches);
    })
    .then(pageFetches => {
      return Promise.all(pageFetches);
    })
    .then(subjectSetPages => {
      const subjectSets = [];
      for (let subjectSetPage of subjectSetPages) {
        subjectSets.push.apply(subjectSets, subjectSetPage);
      }
      return Promise.resolve(subjectSets);
    })
    .catch( function(err){
      console.log('ERROR: ', err);
    });
}

function getAllSubjectsInSet(subjectSetId) {
  const query = { subject_set_id: subjectSetId, page: 1 };
  return api.type('subjects').get(query)
    .then(subjects => {
      const numPages = subjects[0]._meta.subjects.page_count;
      const pageFetches = [Promise.resolve(subjects)];
      for (let i = 2; i <= numPages - 1; i++) {
        let fetcher = api.type('subjects').get(Object.assign({}, query, { page: i }));
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
      return api.type('subject_sets').get({ project_id: projectId })
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
