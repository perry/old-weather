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

    var module = angular.module('transcribe', [
        'ngAnimate',
        'ui.router',
        'ngLoad',
        'angularSpinner',
        'svg',
        'annotation'
    ]);

    module.config(function ($stateProvider) {
        $stateProvider
            .state('transcribe', {
                url: '/annotate/:subject_set_id/',
                views: {
                    main: {
                        controller: 'transcribeCtrl',
                        templateUrl: 'templates/transcribe/transcribe.html'
                    }
                }
            });
    });

    module.config(function logAllEvents($provide) {
        $provide.decorator('$rootScope', function($delegate) {
            var Scope = $delegate.constructor;
            var origBroadcast = Scope.prototype.$broadcast;
            var origEmit = Scope.prototype.$emit;

            Scope.prototype.$broadcast = function() {
                logEvent('$broadcast', arguments);
                return origBroadcast.apply(this, arguments);
            };

            Scope.prototype.$emit = function() {
                logEvent('$emit', arguments);
                return origEmit.apply(this, arguments);
            };
            return $delegate;
        });

        function logEvent(type, args) {
            var eventArgs = Array.prototype.slice.call(args);
            var message = [type, eventArgs.shift()].join(', ');
            if (eventArgs.length > 0) {
                console.log(message, eventArgs);
            } else {
                console.log(message);
            }
        }
    })

    module.directive('transcribeTools', function (svgPanZoomFactory, svgDrawingFactory, toolFactory) {
        return {
            restrict: 'A',
            templateUrl: 'templates/transcribe/_tools.html',
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
                        id: 'useGrid'
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
                    scope.$parent.loadSubject();
                };
            }
        };
    });

    module.factory('toolFactory', function (svgPanZoomFactory, svgDrawingFactory, svgGridFactory) {
        var enable = function (tool) {
            svgPanZoomFactory.disable();
            console.log(tool)
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

    module.factory('gridFactory', function (annotationsFactory, localStorageService, zooAPI, zooAPIProject) {

        var _createAnnotations = function (id) {
            return annotationsFactory.get(id)
                .then(function (response) {
                    // Remove all those that aren't dates, and set the temp grid attribute on them
                    var tempGrid = _.filter(angular.copy(response.annotations), function (annotation) {
                        annotation.temp = true;
                        return annotation.type !== 'date';
                    });
                    console.log(tempGrid)
                    return tempGrid;
                })
        }

        var save = function (id) {
            return _createAnnotations(id)
                .then(function (response) {
                    console.log(response)
                    localStorageService.set('grid', response);
                    return response;
                });
        }

        var load = function (id) {
            annotationsFactory.addMultiple(localStorageService.get('grid'), id);
        }

        // var save = function (id) {
        //     var annotations;
        //     return _createAnnotations(id)
        //         .then(function (response) {
        //             annotations = response;
        //         })
        //         .then(zooAPIProject.get)
        //         .then(function (project) {
        //             console.log(project)
        //             var grid = zooAPI.type('project_preferences').create({
        //                 links: {
        //                     project: project.id
        //                 },
        //                 preferences: {
        //                     grid: annotations
        //                 }
        //             });
        //             console.log(grid)
        //             return grid.save();
        //         });

        return {
            save: save,
            load: load
        };

    });


    module.directive('transcribeQuestions', function ($rootScope, gridFactory, toolFactory, authFactory) {
        return {
            restrict: 'A',
            scope: {
                questions: '=transcribeQuestions'
            },
            templateUrl: 'templates/transcribe/_questions.html',
            link: function (scope, element, attrs) {
                scope.$watch('questions', function () {
                    if (scope.questions && scope.questions.tasks) {
                        scope.tasks = scope.questions.tasks;
                        scope.activeTask = scope.questions.first_task;
                        scope.questionsCompleted = false;
                    }
                });

                scope.$watch('activeTask', function () {

                    console.log(scope.activeTask)

                    // Skip grid tasks if we're not logged in
                    if (scope.activeTask && scope.tasks[scope.activeTask].skip && !authFactory.getUser()) {
                        scope.confirm(scope.tasks[scope.activeTask].skip);
                    }

                    if (scope.activeTask && angular.isDefined(scope.tasks[scope.activeTask].onload)) {
                        scope.tasks[scope.activeTask].onload();
                    }

                    if (scope.activeTask && angular.isDefined(scope.tasks[scope.activeTask].tools)) {
                        toolFactory.enable(scope.tasks[scope.activeTask].tools[0].label);
                    } else {
                        toolFactory.disable();
                    }

                    if (scope.activeTask === 'T5-use-grid') {
                        gridFactory.load(scope.$parent.subject.id)
                    }

                });


                scope.loadGrid = function () {
                    if (answer === 'Yes') {
                        gridFactory.load(scope.$parent.subject.id);
                    }

                    scope.confirm(next);
                };

                scope.saveGrid = function (answer, next) {

                    if (answer === 'Yes') {
                        gridFactory.save(scope.$parent.subject.id);
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
                        $rootScope.$broadcast('transcribe:questionsComplete');
                    }
                };

                scope.skipQuestions = function () {
                    scope.activeTask = undefined;
                    $rootScope.$broadcast('transcribe:questionsComplete');
                };
            }
        };
    });

    module.factory('workflowFactory', function ($q, authFactory, zooAPI, zooAPISubjectSets, zooAPIWorkflows, localStorageService, gridFactory) {
        var get = function (subject_set_id) {
            var deferred = $q.defer();
            zooAPISubjectSets.get({id: subject_set_id})
                .then(function (response) {
                    var workflowID = response[0].links.workflows[0];
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
                question: 'Would you like to use this grid?',
                answers: [
                    {
                        label: 'Yes',
                        next: 'T5-adjust-grid'
                    },
                    {
                        label: 'No',
                        next: 'T5'
                    }
                ]
            };
            workflow.tasks['T5-adjust-grid'] = {
                grid: true,
                instruction: 'If you need to, move the grid into the correct position.',
                next: 'T5-edit-grid'
            };
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

    module.factory('subjectFactory', function ($q, $filter, zooAPI, localStorageService) {
        var _getQueueCache = function (subject_set_id) {
            var cache = localStorageService.get('subject_set_queue_' + subject_set_id);
            if (!cache) {
                cache = localStorageService.set('subject_set_queue_' + subject_set_id, []);
            }

            return cache;
        };

        var _addToQueue = function (subject_set_id, subjects) {
            var cache = _getQueueCache(subject_set_id);

            angular.forEach(subjects, function (subject) {
                upsert(cache, {id: subject.id}, subject);
            });

            cache = $filter('removeCircularDeps')(cache);

            return localStorageService.set('subject_set_queue_' + subject_set_id, cache);
        };

        var _loadNewSubjects = function (subject_set_id) {
            var deferred = $q.defer();

            var lastPage = localStorageService.get('subject_set_page_' + subject_set_id);
            if (!lastPage) {
                lastPage = 0;
            }

            zooAPI.type('subjects').get({
                page: lastPage + 1,
                page_size: 20,
                subject_set_id: subject_set_id
            })
            .then(function (response) {
                if (response.length > 0) {
                    _addToQueue(subject_set_id, response);

                    localStorageService.set('subject_set_page_' + subject_set_id, (lastPage + 1));
                }

                deferred.resolve();
            });

            return deferred.promise;
        };

        var _getNextInQueue = function (subject_set_id) {
            var deferred = $q.defer();

            var cache = _getQueueCache(subject_set_id);

            if (!angular.isArray(cache) || cache.length === 0) {
                _loadNewSubjects(subject_set_id)
                    .then(function () {
                        cache = _getQueueCache(subject_set_id);

                        if (cache.length === 0) {
                            deferred.resolve(null);
                        } else {
                            deferred.resolve(cache[0]);
                        }
                    });
            } else {
                deferred.resolve(cache[0]);
            }

            return deferred.promise;
        };

        var get = function (subject_set_id) {
            var deferred = $q.defer();

            _getNextInQueue(subject_set_id)
                .then(function (subject) {
                    deferred.resolve(subject);
                });


            return deferred.promise;
        };

        return {
            get: get
        };
    });

    module.controller('transcribeCtrl', function ($rootScope, $timeout, $stateParams, $scope, $sce, $state, annotationsFactory, workflowFactory, subjectFactory, svgPanZoomFactory) {
        $rootScope.bodyClass = 'annotate';

        $scope.loadSubject = function () {
            $rootScope.$broadcast('transcribe:loadingSubject');

            $scope.subject_set_id = $stateParams.subject_set_id;
            $scope.subject = undefined;
            $scope.isLoading = true;
            $scope.questions = null;
            $scope.questionsComplete = false;

            workflowFactory.get($scope.subject_set_id)
                .then(function (response) {
                    $scope.questions = response;
                });

            subjectFactory.get($scope.subject_set_id)
                .then(function (response) {
                    if (response !== null) {
                        $timeout(function () {
                            $scope.subject = response;
                            var keys = Object.keys($scope.subject.locations[0]);
                            var subjectImage = $scope.subject.locations[0][keys[0]];
                            // TODO: change this. We're cache busting the image.onload event.
                            subjectImage += '?' + new Date().getTime();
                            $scope.trustedSubjectImage = $sce.trustAsResourceUrl(subjectImage);

                            $rootScope.$broadcast('transcribe:loadedSubject');
                        });
                    } else {
                        $scope.subject = null;
                        $rootScope.$broadcast('transcribe:loadedSubject');
                    }

                });
        };
        $scope.loadSubject();

        $scope.subjectLoaded = function () {
            $scope.isLoading = false;
        };

        $scope.saveSubject = function () {
            console.log($scope)
            annotationsFactory.save($scope.subject.id)
                .then(function () {
                    $scope.loadSubject();
                });
        };

        $scope.saveSubjectAndTranscribe = function () {
            annotationsFactory.save($scope.subject.id)
                .then(function () {
                    $state.go('transcription', { subject_set_id: $scope.subject_set_id });
                });
        };

        $scope.$on('transcribe:svgPanZoomToggle', function () {
            $scope.isAnnotating = !svgPanZoomFactory.status();
        });

        $scope.$on('transcribe:questionsComplete', function () {
            $scope.questionsComplete = true;
        });

        $scope.clearAnnotations = function () {
            if (window.confirm('Remove all annotations?')) {
                $rootScope.$broadcast('transcribe:clearAnnotations');
            }
        };

        $scope.toggleGuides = function () {
            $scope.showGuides = !$scope.showGuides;
        };
    });

}(window.angular, window._));
