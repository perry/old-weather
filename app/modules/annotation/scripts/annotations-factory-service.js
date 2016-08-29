(function (angular, _) {
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

    module.factory('annotationsFactory', function (confirmationModalFactory, $window, $filter, $rootScope, $stateParams, $q, zooAPISubjectSets, localStorageService, zooAPI) {

        var classification;
        var annotationsPrefix = 'annotation_subject_id_';
        var isEnabled = true;

        var create = function (subject_id) {
            var deferred = $q.defer();

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

                            classification = obj;
                            deferred.resolve(classification);
                        });
                });

            return deferred.promise;
        };

        var storeData = function (data, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;
            var classificationObject = localStorageService.get(storageKey);

            var list = localStorageService.get('annotations_list') || [];
            var obj = {subject_id: subject.id, subject_set_id: $stateParams.subject_set_id};
            var item = _.find(list, obj);
            if (angular.isUndefined(item)) {
                list.push(obj);
            }
            localStorageService.set('annotations_list', list);

            upsert(classificationObject.annotations, {_id: data._id}, data);

            localStorageService.set(storageKey, classificationObject);
        };

        var save = function (id) {

            var deferred = $q.defer();

            var storageKey = annotationsPrefix + id;
            var classification = localStorageService.get(storageKey);

            if (classification.annotations.length === 0) {
                var params = {message: 'You haven\'t added any annotations, are you sure you want to finish?'};
                confirmationModalFactory.setParams(params);
                confirmationModalFactory.deployModal( function(deleteType) {
                  if(deleteType){
                    var subject_set_queue = localStorageService.get('subject_set_queue_' + $stateParams.subject_set_id);
                    _.remove(subject_set_queue, {id: id});
                    localStorageService.set('subject_set_queue_' + $stateParams.subject_set_id, subject_set_queue);
                    deferred.resolve();
                  }
                });
            } else {

                classification.metadata.finished_at = new Date().toISOString();
                classification.completed = false;

                var resource = zooAPI.type('classifications').create(classification);
                resource.save()
                    .then(function (response) {
                        response = $filter('removeCircularDeps')(response);
                        localStorageService.set(storageKey, response);

                        var annoList = localStorageService.get('annotations_list');
                        var obj = _.find(annoList, {subject_id: id, subject_set_id: $stateParams.subject_set_id});
                        obj.classification = response.id;
                        upsert(annoList, {subject_id: id}, obj);
                        localStorageService.set('annotations_list', annoList);

                        var subject_set_queue = localStorageService.get('subject_set_queue_' + $stateParams.subject_set_id);
                        _.remove(subject_set_queue, {id: id});
                        localStorageService.set('subject_set_queue_' + $stateParams.subject_set_id, subject_set_queue);

                        deferred.resolve(response);
                    });

            }

            return deferred.promise;
        };

        var get = function (id) {
            var storageKey = annotationsPrefix + id;
            var deferred = $q.defer();

            var data = localStorageService.get(storageKey);
            if (data && data.annotations) {
                deferred.resolve(data);
            } else {
                create(id)
                    .then(function (response) {
                        localStorageService.set(storageKey, response);
                        deferred.resolve(response);
                    });
            }

            return deferred.promise;
        };

        var add = function (data, subject) {
            $rootScope.$broadcast('annotations:add', data);
            storeData(data, subject);
        };

        var addMultiple = function (data, subject) {
            $rootScope.$broadcast('annotations:add', data);
            data.forEach(function (annotation) {
                storeData(annotation, subject);
            });
        };

        var update = function (data, subject) {
            $rootScope.$broadcast('annotations:update', data);
            storeData(data, subject);
        };

        var remove = function (annotationID, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;

            var classificationObj = localStorageService.get(storageKey);
            _.remove(classificationObj.annotations, {_id: annotationID});
            localStorageService.set(storageKey, classificationObj);
            $rootScope.$broadcast('annotations:remove', annotationID);
        };

        var clear = function (data, subject) {
            var id = subject.id;
            var storageKey = annotationsPrefix + id;
            if (data === null) {
                var classificationObj = localStorageService.get(storageKey);
                classificationObj.annotations = [];
                localStorageService.set(storageKey, classificationObj);
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
            remove: remove,
            clear: clear,
            update: update,
            save: save,
            addMultiple: addMultiple,
            isEnabled: isEnabled
        };

        return obj;
    });

}(window.angular, window._));
