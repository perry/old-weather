(function (angular, _) {
    'use strict';

    var upsert = function (arr, key, newVal) {
        var match = _.find(arr, key);
        if (match) {
            var index = _.indexOf(arr, match);
            arr.splice(index, 1, newVal);
        } else {
            arr.push(newVal);
        }
    };

    var module = angular.module('annotate', [
        // 'ngAnimate',
        'ui.router',
        'angularSpinner',
        'svg',
        'annotation',
        'tutorial'
    ]);

    module.config(function ($stateProvider) {
        $stateProvider
            .state('annotate', {
                url: '/annotate/:subject_set_id/',
                views: {
                    main: {
                        controller: 'annotateController',
                        templateUrl: 'templates/annotate.html'
                    }
                }
            });
    });

    module.directive('annotateTools', function (svgPanZoomFactory, svgDrawingFactory, toolFactory) {
        return {
            restrict: 'A',
            templateUrl: 'templates/_tools.html',
            scope: true,
            link: function (scope, element, attrs) {
                scope.tools = [
                    {
                        id: 'header',
                        title: 'Table header'
                    },
                    {
                        id: 'row',
                        title: 'Table row'
                    },
                    {
                        id: 'cell',
                        title: 'Table cell'
                    },
                    {
                        id: 'date',
                        title: 'Date',
                        icon: 'calendar',
                        tooltip: 'Record any mentions of the date'
                    },
                    {
                        id: 'location',
                        title: 'Location',
                        icon: 'globe',
                        tooltip: 'Record any mentions of location'
                    },
                    {
                        id: 'weather',
                        title: 'Weather',
                        icon: 'cloud'
                    },
                    {
                        id: 'sea-ice',
                        title: 'Sea Ice',
                        icon: 'asterisk',
                        tooltip: 'Record any mentions of sea ice'
                    },
                    {
                        id: 'refueling',
                        title: 'Refueling',
                        icon: 'oil',
                        tooltip: 'Enter any mentions of the ship\'s refueling'
                    },
                    {
                        id: 'events',
                        title: 'Events',
                        icon: 'list-alt',
                        tooltip: 'Note any other interesting events on the ship'
                    },
                    {
                        id: 'animals',
                        title: 'Animals',
                        icon: 'piggy-bank',
                        tooltip: 'Enter any mentions of animals sighted or captured'
                    },
                    {
                        id: 'mentions',
                        title: 'Mentions',
                        icon: 'bullhorn',
                        tooltip: 'Record any mentions of people or ships'
                    }
                ];

                scope.toggleHover = function (i) {
                    scope.tools[i].hover = !scope.tools[i].hover;
                };

                scope.toggleTool = function (i) {
                    var thisTool = scope.tools[i];

                    // Disable all other tools.
                    angular.forEach(scope.tools, function (tool, index) {
                        if (index !== i) { tool.active = false; }
                    });

                    // Toggle the active state of this tool.
                    if (angular.isDefined(i)) {
                        thisTool.active = !thisTool.active;
                    }

                    // Define the active tool on the parent scope.
                    scope.$parent.activeTool = thisTool && thisTool.active ? thisTool : null;

                    // Toggle pan zoom based on the active tool.
                    if (_.isNull(scope.$parent.activeTool)) {
                        toolFactory.disable();
                    } else {
                        toolFactory.enable(thisTool.id);
                    }
                };

                scope.newSubject = function () {
                    scope.toggleTool();
                    scope.$parent.loadSubjects('next'); // check that this works!
                };
            }
        };
    });

    module.factory('toolFactory', function (svgPanZoomFactory, svgDrawingFactory, svgGridFactory) {

      var enable = function (tool) {
        svgPanZoomFactory.disable();
        svgDrawingFactory.bindMouseEvents({type: tool});
      };

      var disable = function () {
        svgPanZoomFactory.enable();
        svgDrawingFactory.unBindMouseEvents();
      };

      return {
        enable: enable,
        disable: disable
      };

    });

    module.factory('gridFactory', function ($rootScope, annotationsFactory, localStorageService, zooAPI, zooAPIProject, svgGridFactory, svgPanZoomFactory) {

        var factory;
        var _currentGrid = [];
        var _grids = localStorageService.get('grids') || [];
        var isMoveEnabled = false;

        factory = {
            del: deleteGrid,
            get: getGrid,
            hide: hideGrid,
            list: listGrids,
            save: saveGrid,
            show: showGrid,
            use: useGrid,
            enableMove: enableMove,
            disableMove: disableMove,
            moveGrid: moveGrid,
            createPoint: createPoint,
            updateGrid: updateGrid
        };

        return factory;

        // Returns all the grids in local storage
        function listGrids() {
            return _grids;
        }

        // Hides the grid from view
        function hideGrid() {
            _currentGrid = [];
        }

        // Show a grid with a given ID
        function showGrid(id) {
            id = id || 0;
            _currentGrid = _grids[id];
        }

        // Return the _currentGrid so it can be bound to the view
        function getGrid() {
            return _currentGrid;
        }

        // Copy the content of the grid as annotations
        function useGrid() {
            _currentGrid.forEach(function (cell) {
                $rootScope.$broadcast('svgDrawing:add', cell);
            });
        }

        // Save the grid to local storage for reuse
        function saveGrid(data) {
            _grids.push(angular.copy(data));
            localStorageService.set('grids', _grids);
        }

        // not sure this is needed?
        function updateGrid(data) {
          var index = _grids.indexOf(data);
          _grids.splice(index, 1, data); // replace element with updated version
          localStorageService.set('grids', _grids);
        }

        // Delete grid from local storage
        function deleteGrid(index) {
            _grids.splice(index, 1);
            localStorageService.set('grids', _grids);
        }

        function moveGrid(currentGrid, initialClick, e) {
          if (!isMoveEnabled) return;
          var currentPos = svgGridFactory.createPoint(e);
          var index = _grids.indexOf(currentGrid);

          // use as a reference
          var beforeGrid = localStorageService.get('grids')[index];

          for(let annotation of currentGrid) {
            var beforeAnnotation = _.filter(beforeGrid, {_id: annotation._id});
            let xBefore = beforeAnnotation[0].x;
            let yBefore = beforeAnnotation[0].y;
            annotation.x = xBefore + currentPos.x - initialClick.x;
            annotation.y = yBefore + currentPos.y - initialClick.y;
          }
          showGrid(index);
        }

        function enableMove(e) {
          isMoveEnabled = true;
          annotationsFactory.isEnabled = false; // prevents deleting annotations (and modals produces)
        };

        function disableMove(e) {
          isMoveEnabled = false;
          annotationsFactory.isEnabled = true;
        };

        function createPoint(e) {
          var newPoint = svgGridFactory.createPoint(e);
          return newPoint;
        };

    });

    module.directive('annotateQuestions', function ($rootScope, $timeout, annotationsFactory, gridFactory, toolFactory, authFactory) {
        return {
            restrict: 'A',
            scope: {
                questions: '=annotateQuestions'
            },
            templateUrl: 'templates/_questions.html',
            link: function (scope, element, attrs) {

                scope.grids = [];

                scope.$watch('questions', function () {
                    if (scope.questions && scope.questions.tasks) {
                        scope.tasks = scope.questions.tasks;
                        scope.activeTask = scope.questions.first_task;
                        scope.questionsCompleted = false;
                    }
                });

                scope.$watch('activeTask', function () {

                    toolFactory.disable(); // reset mouse events (removes duplicates)

                    // Skip grid tasks if we're not logged in
                    if (scope.activeTask && scope.tasks[scope.activeTask].grid && !authFactory.getUser()) {
                        scope.confirm(scope.tasks[scope.activeTask].skip);
                        return; // prevent duplicate event bindings after skipping task
                    }

                    if (scope.activeTask && angular.isDefined(scope.tasks[scope.activeTask].tools)) {
                        toolFactory.enable(scope.tasks[scope.activeTask].tools[0].label);
                    } else {
                        toolFactory.disable();
                    }

                    /* Begin grid-related stuff */
                    if (scope.activeTask === 'T5-use-grid') {
                        gridFactory.enableMove(); // and disable deleting annotations
                        if (gridFactory.list().length === 0) {
                            scope.confirm(scope.tasks[scope.activeTask].skip);
                        } else {
                            scope.grids = gridFactory.list();
                            scope.showGrid(0);
                        }

                    } else {
                      gridFactory.disableMove();
                    }

                });

                scope.loadGrid = function (answer, next) {
                    if (answer === 'Yes') {
                        gridFactory.use();
                    }

                    gridFactory.hide();
                    scope.confirm(next);
                };

                scope.showGrid = function (index) {
                    scope.active = index;
                    gridFactory.show(index);
                };

                scope.deleteGrid = function (index) {
                    gridFactory.del(index);
                    if (gridFactory.list().length) {
                        scope.showGrid(0);
                    } else {
                        gridFactory.hide();
                        scope.confirm(scope.tasks[scope.activeTask].skip);
                    }
                };

                scope.saveGrid = function (answer, next) {
                    if (answer === 'Yes') {
                        annotationsFactory.get(scope.$parent.subject.id)
                            .then(function (response) {
                                gridFactory.save(response.annotations);
                            });
                    }

                    // In practice this will be undefined as this is the last task,
                    // but this is consistent with the current API.
                    scope.confirm(next);
                };

                scope.confirm = function (value) {
                    if (value && _.isString(value)) {
                        scope.activeTask = value;
                    } else {
                        scope.activeTask = undefined;
                        $rootScope.$broadcast('annotate:questionsComplete');
                    }
                };

                scope.skipQuestions = function () {
                    scope.activeTask = undefined;
                    $rootScope.$broadcast('annotate:questionsComplete');
                };
            }
        };
    });

    module.factory('workflowFactory', function ($q, authFactory, zooAPI, zooAPISubjectSets, zooAPIWorkflows, localStorageService, gridFactory) {
        var get = function (subject_set_id) {
            var deferred = $q.defer();
            zooAPISubjectSets.get({id: subject_set_id})
                .then(function (response) {
                    var workflowID = response[0].links.workflows[0]; // Note: Defaulting to first workflow may cause unexpected issues
                    zooAPIWorkflows.get(workflowID)
                        .then(addReuseGridTask)
                        .then(deferred.resolve, deferred.reject, deferred.notify);
                });

            return deferred.promise;
        };

        function addReuseGridTask(workflow) {
            workflow.tasks.T4.answers[0].next = 'T5-use-grid';
            workflow.tasks.T6.next = 'T6-save-grid';
            workflow.tasks['T5-use-grid'] = {
                grid: true,
                skip: 'T5',
                question: 'Would you like to use this grid? If you need to, move the grid into the correct position.',
                answers: [
                    {
                        label: 'Yes',
                        // next: 'T5-adjust-grid'
                        next: 'T5-edit-grid'
                    },
                    {
                        label: 'No',
                        next: 'T5'
                    }
                ]
            };

            // // No longer needed?
            // // Commented out while we focus on getting this out of the door
            // workflow.tasks['T5-adjust-grid'] = {
            //     grid: true,
            //     instruction: 'If you need to, move the grid into the correct position.',
            //     next: 'T5-edit-grid'
            // };
            workflow.tasks['T5-edit-grid'] = {
                grid: true,
                instruction: 'Draw or remove any additional cells.',
                next: 'T6-save-grid',
                type: 'drawing',
                tools: [
                    {
                        color: '#00ff00',
                        details: [],
                        label: 'cell',
                        type: 'rectangle'
                    }
                ]
            };
            workflow.tasks['T6-save-grid'] = {
                grid: true,
                // Skip to the end...
                skip: undefined,
                question: 'Would you like to save this grid for future use?',
                answers: [
                    {
                        // We'll handle grid saving from the annotations factory
                        label: 'Yes'
                    },
                    {
                        label: 'No'
                    }
                ]
            };
            return workflow;
        }

        return {
            get: get
        };
    });

    module.factory('subjectFactory', function ($q, $filter, zooAPI, localStorageService, zooAPIProject, $timeout) {

        var _getPrevQueueCache = function (subject_set_id) {
            let cache = localStorageService.get('subject_set_prev_queue_' + subject_set_id);
            if (!cache) {
              localStorageService.set('subject_set_prev_queue_' + subject_set_id, []);
              cache = localStorageService.get('subject_set_prev_queue_' + subject_set_id);
            }
            return cache;
        };

        var _getNextQueueCache = function (subject_set_id) {
            let cache = localStorageService.get('subject_set_next_queue_' + subject_set_id);
            if (!cache) {
              localStorageService.set('subject_set_next_queue_' + subject_set_id, []);
              cache = localStorageService.get('subject_set_next_queue_' + subject_set_id);
            }
            return cache;
        };

        var _addToNextQueue = function (subject_set_id, subjects) {
            var cache = _getNextQueueCache(subject_set_id);

            angular.forEach(subjects, function (subject) {
                upsert(cache, {id: subject.id}, subject);
            });

            cache = $filter('removeCircularDeps')(cache);
            return localStorageService.set('subject_set_next_queue_' + subject_set_id, cache);

        };

        var _loadNewSubjects = function (subject_set_id) {
            var deferred = $q.defer();

            var _getSubjectsPage = function (project) {

                var current_subject = getCurrentSubject(subject_set_id);
                var subject_ids = current_subject ? current_subject.metadata.nextSubjectIds : null;
                var params = {}

                if (subject_ids) {
                  console.log(' *** FETCHING SUBJECT WITH IDS %s ***', subject_ids.toString()); // --STI
                  params = { id: subject_ids }
                } else {
                  console.log(' *** FETCHING RANDOM SUBJECT ***'); // --STI
                  params = {
                    subject_set_id: subject_set_id,
                    page_size: 1,
                    sort: 'queued',
                    workflow_id: project.configuration.default_workflow
                  };
                }

                return zooAPI.type('subjects').get(params)
                  .then(function (subjects) {
                    console.log('      >>>>>>>>> CURRENT PAGE: ' + subjects[0].metadata.pageNumber + ', ID: ' + subjects[0].id + ' <<<<<<<<<<'); // --STI
                    // localStorageService.set('current_subject_' + subject_set_id, subjects[0]);
                    preloadSubjectImages(subjects);
                    return subjects;
                  });
            };

            var preloadSubjectImages = function (subjects) {
              let images = [];
              for (let subject of subjects) {
                let keys = Object.keys(subject.locations[0]);
                // console.log('PRELOADING: ', subject.locations[0][keys[0]]);
                images.push( new Image().src = subject.locations[0][keys[0]] );
              }
            }

            var project;

            zooAPIProject.get() // first, we need project to determine which workflow/subject set to fetch from
                .then(function (response) {
                    project = response;
                    return _getSubjectsPage(response);
                })
                .then(function (response) {
                    return response;
                }, function (response) {
                    return $timeout(_getSubjectsPage, 3000, true, project);
                })
                .then(function (response) {
                    if (response.length > 0) {
                        _addToNextQueue(subject_set_id, response);
                        deferred.resolve();
                    } else {
                        deferred.reject();
                    }

                });

            return deferred.promise;
        };

        var _getNextInQueue = function (subject_set_id, cacheDirection) {

            var _getCache = function(subject_set_id, cacheDirection) {
              var cache = [];
              if (cacheDirection == 'prev') {
                cache = _getPrevQueueCache(subject_set_id);
              } else if (cacheDirection == 'next') {
                cache = _getNextQueueCache(subject_set_id);
              } else { // initial
                cache = _getNextQueueCache(subject_set_id);
              }
              return cache;
            }

            var deferred = $q.defer();
            var cache = _getCache(subject_set_id, cacheDirection);

            if (!angular.isArray(cache) || cache.length === 0) {
                _loadNewSubjects(subject_set_id)
                    .then(function () {
                        cache = _getCache(subject_set_id, cacheDirection);
                        if (cache.length === 0) {
                          deferred.resolve(null); // Note: I think this means we're done with all subjects in the set?
                        } else {
                          deferred.resolve(cache[0]); // get first element
                        }
                    });
            } else {
              deferred.resolve(cache[0]);
            }

            return deferred.promise;
        };

        var _updateCache = function(nextSubject, subject_set_id, cacheDirection) {
          var oldSubject = getCurrentSubject(subject_set_id);

          localStorageService.set('current_subject_' + subject_set_id, nextSubject );
          var nextCache = _getNextQueueCache(subject_set_id);
          var prevCache = _getPrevQueueCache(subject_set_id);

          if (cacheDirection == 'next') {
            _.remove(nextCache, {id: nextSubject.id});    // remove previous subject
            if( prevCache.length >= 5) prevCache.pop();   // remove last subject in array
            prevCache.unshift(oldSubject);                // prepend old subject to array
          }

          else if (cacheDirection == 'prev') {
            if( nextCache.length >= 5) nextCache.pop();   // remove last subject in array
            _.remove(prevCache, {id: nextSubject.id});    // remove previous subject
            nextCache.unshift(oldSubject);                // prepend old subject to array
          }

          else { // INITIAL CACHE
            // TO DO: Fix this; it keeps advancing the pages on refresh.
            nextCache.shift();                            // remove first subject in array
          }

          localStorageService.set('subject_set_next_queue_' + subject_set_id, nextCache);
          localStorageService.set('subject_set_prev_queue_' + subject_set_id, prevCache);

          // FOR DEBUGGING >>>
          {
            var prevSubjectIds = [];
            for(var subject of prevCache) {
               prevSubjectIds.push( subject.metadata.pageNumber );
            }

            var nextSubjectIds = [];
            for(var subject of nextCache) {
               nextSubjectIds.push( subject.metadata.pageNumber );
            }

            console.log('PREV SUBJECT PAGES    : ', prevSubjectIds);
            console.log('CURRENT SUBJECT PAGES : ', localStorageService.get('current_subject_' + subject_set_id).metadata.pageNumber );
            console.log('NEXT SUBJECT PAGES    : ', nextSubjectIds);
          }
          // <<< FOR DEBUGGING

        }

        var get = function (subject_set_id, cacheDirection) {
            var deferred = $q.defer();
            _getNextInQueue(subject_set_id, cacheDirection)
              .then( function(nextSubject) {
                _updateCache(nextSubject, subject_set_id, cacheDirection);
                deferred.resolve(nextSubject);
              });
            return deferred.promise;
        };

        var getCurrentSubject = function (subject_set_id) {
          let currentSubject = localStorageService.get('current_subject_' + subject_set_id);
          if( typeof currentSubject !== "undefined" && currentSubject !== null){
            return currentSubject;
          }
          return null;
        }

        return {
            get: get,
            getCurrentSubject: getCurrentSubject
        };
    }); // END SUBJECT FACTORY

    module.controller('TranscribeNavController', function ($scope, $stateParams, $modal, subjectFactory, localStorageService) {

      // update prev/next buttons
      $scope.$on('transcribe:loadedSubject', function(newValue, oldValue) {
        var currentSubject = subjectFactory.getCurrentSubject($stateParams.subject_set_id);
        var prevCache = localStorageService.get('subject_set_prev_queue_' + $stateParams.subject_set_id);
        $scope.nextDisabled = currentSubject.metadata.nextSubjectIds ? false : true
        $scope.prevDisabled = currentSubject.metadata.nextSubjectIds && !prevCache.length == 0 ? false : true
      });

      $scope.nextPage = function() {
        console.log('NEXT PAGE >>>'); // --STI
        $scope.loadSubjects('next');
      }

      $scope.prevPage = function() {
        console.log('<<< PREV PAGE'); // --STI
        $scope.loadSubjects('prev');
      }

    });

    module.controller('annotateController', function ($rootScope, $timeout, $stateParams, $scope, $sce, $state, annotationsFactory, workflowFactory, subjectFactory, svgPanZoomFactory, gridFactory) {
      $rootScope.bodyClass = 'annotate';

      $scope.loadSubjects = function (cacheDirection) {
        $rootScope.$broadcast('annotate:loadingSubject');

        $scope.subject_set_id = $stateParams.subject_set_id;
        $scope.subject = undefined;
        $scope.isLoading = true;
        $scope.questions = null;
        $scope.questionsComplete = false;
        $scope.grid = gridFactory.get;

        workflowFactory.get($scope.subject_set_id)
          .then(function (response) {
            $scope.questions = response;
          });

        subjectFactory.get($scope.subject_set_id, cacheDirection)
          .then(function (response) {
            if (response !== null) {
              $timeout(function () {
                $scope.subject = response;
                var keys = Object.keys($scope.subject.locations[0]);
                var subjectImage = $scope.subject.locations[0][keys[0]];

                // TODO: change this. We're cache busting the image.onload event.
                // subjectImage += '?' + new Date().getTime();
                $scope.trustedSubjectImage = $sce.trustAsResourceUrl(subjectImage);
                $scope.loadHandler = $scope.subjectLoaded(); // is loadHandler still used? --STI
                $rootScope.$broadcast('annotate:loadedSubject');
              });
            } else {
              $scope.subject = null;
              $rootScope.$broadcast('annotate:loadedSubject');
            }

          });
      };

      $scope.loadSubjects('initial');

      $scope.subjectLoaded = function () {
        $scope.isLoading = false;
      };

      $scope.saveSubject = function () {
        annotationsFactory.save($scope.subject.id)
          .then(function () {
            $scope.loadSubjects('next');
          });
      };

      $scope.saveSubjectAndTranscribe = function () {
        annotationsFactory.save($scope.subject.id)
          .then(function () {
            $state.go('transcribe', { subject_set_id: $scope.subject_set_id });
          });
      };

      $scope.$on('annotate:svgPanZoomToggle', function () {
        $scope.isAnnotating = !svgPanZoomFactory.status();
      });

      $scope.$on('annotate:questionsComplete', function () {
        $scope.questionsComplete = true;
      });

      $scope.clearAnnotations = function () {
        $rootScope.$broadcast('annotate:clearAnnotations');
      };

    }); // end annotateController

}(window.angular, window._));
