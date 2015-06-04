(function (angular) {
    'use strict';

    var module = angular.module('annotation');

    var upsert = function (arr, key, newVal) {
        var match = _.find(arr, key);
        if (match) {
            var index = _.indexOf(arr, match);
            arr.splice(index, 1, newVal);
        } else {
            arr.push(newVal);
        }
    };

    module.factory('annotationsFactory', function ($rootScope, $stateParams, $q, zooAPISubjectSets, localStorageService, zooAPI) {

        var self = this;

        var annotationsPrefix = 'annotation_subject_id_';

        var create = function (subject_id) {
            var subject_set_id = $stateParams.subject_set_id;
            zooAPISubjectSets.get({id: subject_set_id})
                .then(function (response) {
                    var subject_set = response[0];

                    var obj = {
                        annotations: [],
                        metadata: {
                            started_at: new Date().toISOString(),
                            user_agent: navigator.userAgent,
                            user_language: navigator.language
                        },
                        links: {
                            project: subject_set.links.project,
                            subjects: [subject_id]
                        }
                    };

                    zooAPI.type('workflows').get({id: subject_set.links.workflows[0]})
                        .then(function (response) {
                            var workflow = response[0];
                            obj.links.workflow = workflow.id;
                            obj.metadata.workflow_version = workflow.version;

                            self.classification = zooAPI.type('classifications').create(obj)
                        });
                });

        }

        var storeData = function (data, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;
            var arr = localStorageService.get(storageKey);
            if (!arr) {
                arr = [];
            }

            var list = localStorageService.get('annotations_list');
            if (!list) {
                list = [];
            }
            var obj = {subject_id: subject.id, subject_set_id: $stateParams.subject_set_id};
            var item = _.find(list, obj);
            if (angular.isUndefined(item)) {
                list.push(obj);
            }
            localStorageService.set('annotations_list', list);

            upsert(arr, {_id: data._id}, data);

            localStorageService.set(storageKey, arr);

            // var obj = {
            //     'annotations': arr,
            //     'completed': false,
            //     'metadata': self.classification.metadata
            // };
            // obj.metadata.finished_at = new Date().toISOString();
            //
            // self.classification.update(obj)
        };

        var syncData = function () {
            // var obj = {
            //     'completed': true,
            //     'metadata': self.classification.metadata
            // };
            // obj.metadata.finished_at = new Date().toISOString();
            // self.classification.update(obj);
            // self.classification.save()
            //     .then(function (response) {
            //         console.log(response);
            //         self.classification.get('subjects')
            //             .then(function (response) {
            //                 console.log(response);
            //                 self.classification.destroy();
            //             })
            //     })
        };

        var get = function (id) {
            // create(id)
            var storageKey = annotationsPrefix + id;
            var deferred = $q.defer();

            var data = localStorageService.get(storageKey);
            deferred.resolve(data);

            return deferred.promise;
        };

        var add = function (data, subject) {
            $rootScope.$broadcast('annotations:add', data);
            storeData(data, subject);
        };

        var update = function (data, subject) {
            $rootScope.$broadcast('annotations:update', data);
            storeData(data, subject);
        };

        var clear = function (data, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;
            if (data === null) {
                localStorageService.set(storageKey, []);
            }

            // Remove the subject from the annotations list.
            var list = localStorageService.get('annotations_list');
            if (!list) {
                list = [];
            }
            var obj = {subject_id: subject.id, subject_set_id: $stateParams.subject_set_id};
            _.remove(list, obj);
            localStorageService.set('annotations_list', list);

            $rootScope.$broadcast('annotations:clear');
        };

        var obj = {
            create: create,
            get: get,
            add: add,
            clear: clear,
            update: update,
            sync: syncData
        };

        return obj;
    });

}(window.angular));
