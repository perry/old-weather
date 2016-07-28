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
const cliTable = require('cli-table');

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
    })
  .command('link-pages', 'Creates a linked list among subjects in a set to support sequential pages', function (yargs) {
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
        .option('cache-size', {
          describe: 'Set cache size for prev/next subjects',
          default: 5,
          type: 'integer'
        })
        .option('dryrun', {
          describe: 'Create a linked list without deploying subject changes',
          type: 'boolean'
        })
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
    })
  .global('env')
  .strict()
  .epilogue('Copyright 2016 Zooniverse')
  .wrap(null)
  .argv;

console.log('NODE_ENV is \"%s\"', argv.env);

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

  auth.signIn(credentials).then(() => {

    switch(argv._[0]) {

      /* List subject sets available to active user */
      case 'list':
        list();
        break;
      /* Create linked list among subjects in subject set */
      case 'link-pages':
        linkPages();
        break;
      /* Update subject set status */
      case 'update-status':
        updateStatus();
        break;

      default:
        console.log('Unknown command!');
        break;
    }

  });

});

function list() {
  let table = new cliTable({
    head: ['ID', 'Active', 'Count', 'Short Name', 'Display Name'],
    colWidths: [10, 10, 10, 20, 20]
  });

  getAllSubjectSets(argv.project).then( function(subjectSets) {
    subjectSets.map( function(subjectSet) {
      table.push([
        subjectSet.id                        ? subjectSet.id : 'n/a',
        subjectSet.metadata.active           ? subjectSet.metadata.active : 'n/a',
        subjectSet.set_member_subjects_count ? subjectSet.set_member_subjects_count : 'n/a',
        subjectSet.metadata.shortName        ? subjectSet.metadata.shortName : 'n/a',
        subjectSet.display_name              ? subjectSet.display_name : 'n/a'
      ]);
    });
    console.log(table.toString());
  });
}

function updateStatus() {
  let shortName = argv.shortName ? argv.shortName :  '';
  api.type('subject_sets').get({id: argv.subjectSet}).update({metadata:{active: argv.active, shortName: shortName}}).save()
    .catch( function(err) {
      console.log('ERROR: ', err);
    })
}

function linkPages() {
  getAllSubjectsInSet(argv.subjectSet).then( function(subjects) {
    let updatedSubjects = addNextLinksToSubjectSet(subjects);
    if( updatedSubjects.length == 0 ) {
      console.log('No subjects to update.');
      process.exit();
    }

    if (argv.dryrun) {
      console.log(JSON.stringify(updatedSubjects));
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
            console.log('Finished updating subjects.\nTip: Remember to add the subject set to the workflow.');
        });
      } else {
        console.log('Aborted.');
        process.exit();
      }
    })
  });
}

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
  console.log('%d Updating page %d', index, subject.metadata.pageNumber);
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

function addNextLinksToSubjectSet(subjects) {
  console.log('# subjects = ', subjects.length); // --STI
  var cacheSize = argv.cacheSize;

  console.log('Using cache size: ', cacheSize);

  subjects = subjects
    .filter(subject => { // skip subjects missing page number
      var hasPageNumber = (typeof subject.metadata.pageNumber !== 'undefined' && subject.metadata.pageNumber !== null);
      if (!hasPageNumber) {
        console.log('Warning: Skipped subject (' + subject.id + '); missing metadata.pageNumber');
      }
      return hasPageNumber;
    })
    .sort( (subject1, subject2) => { return parseInt(subject1.metadata.pageNumber) - parseInt(subject2.metadata.pageNumber) });

  subjects = subjects.map((subject, i) => {  // once sorted by page number, add next/prev subject ids to each subject

    console.log('SUBJECT PAGE NUMBER: ', subject.metadata.pageNumber);
    subject.metadata.prevSubjectIds = [];
    subject.metadata.nextSubjectIds = [];

    var currentIndex = subjects.indexOf(subject);

    // look ahead
    var i = 1, nextSubject = subjects[currentIndex+i];
    while( i <= cacheSize && typeof nextSubject !== "undefined" && nextSubject !== null ) {
      subject.metadata.nextSubjectIds.push( nextSubject.id );
      i++;
      nextSubject = subjects[currentIndex+i];
    }

    // look back
    var j = 1, prevSubject = subjects[currentIndex-j];
    while( j <= cacheSize && typeof prevSubject !== "undefined" && prevSubject !== null ) {
      subject.metadata.prevSubjectIds.push( prevSubject.id );
      j++;
      prevSubject = subjects[currentIndex-j];
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
      for (let i = 2; i <= numPages; i++) {
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
}

function getAllSubjectsInSet(subjectSetId) {
  const query = { subject_set_id: subjectSetId, page: 1 };
  return api.type('subjects').get(query)
    .then(subjects => {
      console.log('BATCH: 1'); // --STI
      for(let subject of subjects) {
        console.log('SUBJECT PAGE NUMBER: ', subject.metadata.pageNumber); // --STI
      }
      const numPages = subjects[0]._meta.subjects.page_count;
      const pageFetches = [Promise.resolve(subjects)];
      for (let i = 2; i <= numPages; i++) {
        let fetcher = api.type('subjects').get(Object.assign({}, query, { page: i }));
        pageFetches.push(fetcher);
        console.log('BATCH: %d', i); // --STI
        for (let subject of subjects) {
          console.log('SUBJECT PAGE NUMBER: ', subject.metadata.pageNumber); // --STI
        }
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

// // Generate random page numbers for staging subjects (they don't have any currently)
// function addRandomPageNumbersToSubjects() {
//   return getAllSubjectsInProject(OW_STAGING_PROJECT_ID)
//     .then(subjects => {
//       const usedPageNums = [];
//       const savePromises = [];
//       subjects.forEach((subject, i) => {
//         let pageNum = Math.round(Math.random() * 50);
//         while(usedPageNums.indexOf(pageNum) > -1) {
//           let pageNum = Math.round(Math.random() * 50);
//         }
//         subject.metadata.pageNumber = pageNum;
//         savePromises.push(subject.save());
//       });
//
//       Promise.all(savePromises)
//         .then(savedSubjects => {
//           console.log('Success!', savedSubjects);
//         })
//         .catch(err => {
//           console.log('Error!', err);
//         });
//     });
// }
//
// // addRandomPageNumbersToSubjects();
