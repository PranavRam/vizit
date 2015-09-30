angular.module('vizit')
			.controller('MainCtrl', MainCtrl);

angular.module('vizit').controller('AchSummaryCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.gridOptions = {
  };

  $scope.gridOptions.columnDefs = [
    { field:'name' },
    { field:'gender' },
    { field: 'spark', cellTemplate: '/public/partials/sparkline-cell.html', width: 100 }
  ];

  $http.get('https://cdn.rawgit.com/angular-ui/ui-grid.info/gh-pages/data/100.json')
    .success(function(data) {
      data.forEach(function (d) {
        d.spark = {
          options: {
            chart: {
              type: 'sparklinePlus',
              height: 20,
              width: 100,
              x: function(xd, i) { return i; }
            }
          },
          data: []
        };
        
        // Generate random X values
        for (i=0; i<10; i++) {
          d.spark.data.push({ x: i, y: Math.floor(Math.random()*(100-1+1)+1) });
        }
      });
      
      $scope.gridOptions.data = data;
    });
}]);
function MainCtrl($scope, $http, $mdMenu, $rootScope, $timeout, $state, $compile, $q) {
	$scope.documents = [];
  $scope.entities = [];
  $scope.selectedDocument = {};
  $scope.selectedEntity = {};
  $scope.selectedEntityConnections = [];
  $scope.entityType = "Person";
  $scope.entityTypes = ["Person", "Organization", "Duration", "Number", "Date", "Location", "Time"];
  $scope.entityViewer = {
    selectedEntityType: "Person"
  };
  $scope.currentState = $state.current.name;
  $scope.showDocumentText = true;
  $scope.evidences = [];
  $scope.evidenceList = {
    hover: '',
    selected: ''
  }
  $scope.hypotheses = [];
  $scope.hypothesesList = {
    hover: '',
    selected: ''
  }
  var entityCountScale = d3.scale.linear();
  var colorScale = d3.scale.linear() // <-A
         // .domain([0, min, max])
         // .range(["white", "#ffdc8c", "#ff9600"]);
  $scope.ach = {
    toolbar: {
      isOpen: false
    },
    searchInput: "",
    fullscreen: false,
    selectedHypothesis: null,
    selectedEvidence: null,
    showDocumentViewer: true
  };
  $scope.config = {}; // use defaults
  $scope.model = {}; // always pass empty object
  var entityCountWidth = 40;

  $scope.getConnections = function(entity) {
    $scope.selectedEntity = entity;
    $http.get('/api/connections/'+entity._id).
      then(function(response) {
        var connections = response.data;
        var extent = d3.extent(connections, function(d) { return d.count; });
        // console.log(extent);
        colorScale
            .domain(extent)
            .range(["#ffdc8c", '#ffd278','#ffc864','#ffbe50','#ffb43c','#ffaa28','#ffa014']);
        $scope.selectedEntityConnections = connections;
      }, function(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
  };
  $scope.go = function(stateLoc) {
    $state.go(stateLoc);
    $scope.currentState = stateLoc;
  }
  $scope.getConnectionStrength = function(entity) {
    if(!entity) return 'white';
    if(entity._id === $scope.selectedEntity._id) return '#ff9600';
    var found = false;
    $scope.selectedEntityConnections.forEach(function(connection) {
      if(connection._id === entity._id){
        found = colorScale(entity.count);
      }
    });
    if(!found) return 'white';
    return found;
  }

  $scope.getOccurenceWidth = function(count) {
    return Math.round(entityCountScale(count)) + 'px';
  }

  $scope.getEvidenceWidth = function(weight) {
    return Math.round(weight * 5) + 'px';
  }

  $scope.getHypothesisWidth = function(weight) {
    return Math.round(weight * 5) + 'px';
  }

  $scope.selectDocument = function(doc) {
    if($scope.selectedDocument._id !== doc._id){
      doc.viewCount = doc.viewCount + 1;
    };
    $scope.selectedDocument = doc;
  };
  
  $http.get('/api/documents').
    then(function(response) {
      $scope.documents = response.data.map(function(data) {
        data.viewCount = 0;
        return data;
      });
      // console.log($scope.documents);
      $scope.selectedDocument = $scope.documents[0];
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $http.get('/api/entities').
    then(function(response) {
      var entities = response.data;
      var extent = d3.extent(entities, function(d) { return d.tfidf; });
      // console.log(extent);
      entityCountScale
          .domain(extent)
          .range([1, entityCountWidth]);
      
      $scope.entities = entities;
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $http.get('/api/evidences').
    then(function(response) {
      var evidences = response.data;
      // console.log(extent);
      $scope.evidences = evidences;
      if($scope.ach.updateACH) $scope.ach.updateACH();
    }, function(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  var template = `
    <div class="md-open-menu-container md-whiteframe-z2">
        <md-menu-content>
            <md-menu-item>
              <md-button class="menu-container-item" ng-click="log(selectedDocument.selectedText)">
                add to {{ach.selectedHypothesis.name}} 
              </md-button>
            </md-menu-item>
        </md-menu-content>
      </div>
  `;

  var documentMenu = _.template(template);
  // var myCustomMenu = angular.element($compile()($scope));

  $scope.log = function(sentence) { console.log(sentence) };

  var RightClickMenuCtrl = {
    top: 0,
    left: 0,
    open: function(event) {
      if(!$scope.ach.selectedHypothesis) return;
      RightClickMenuCtrl.left = event.clientX;
      RightClickMenuCtrl.top = event.clientY;
      $mdMenu.show({
        scope: $scope,
        mdMenuCtrl: RightClickMenuCtrl,
        element: function() {
          $scope.selectedDocument.selectedText = event.target.innerHTML;
          // var menu = documentMenu({sentence: _.escape(event.target.innerHTML)});
          return angular.element($compile(template)($scope));
        }(),
        target: 'body' // used for where the menu animates out of
      });
    },
    close: function() { $mdMenu.hide(); },
    positionMode: function() { return { left: 'target', top: 'target' }; },
    offsets: function() { return { top: RightClickMenuCtrl.top, left: RightClickMenuCtrl.left }; }
  };
  $scope.check = function($event) {
    RightClickMenuCtrl.open($event);
  }

  function getEntitiesInSentence(sentence) {
    var parsedHTML = $.parseHTML(sentence);
    var entities = {};
    $scope.entityTypes.forEach(function(entityType) {
      var entitiesFilter = parsedHTML.filter(function(node) {
        return node.tagName === entityType.toUpperCase();
      });
      if(entitiesFilter.length){
        entities[entityType] = entitiesFilter.map(function(entity) {
          return  {
            name: entity.innerHTML,
            id: +entity.getAttribute('data-entity-id')
          }
        });
      }
    });
    return entities;
  }

  function getEntitiesForEvidence(entities) {
    var promises = [];
    for(entityType in entities){
      if(entities.hasOwnProperty(entityType)){
        var arrayEntities = _.uniq(entities[entityType], 'id');
        angular.forEach(arrayEntities, function(entity) {
          var promise = $http({
              url   : 'api/entities/' + entity.id,
              method: 'GET'
          });
          promises.push(promise);
        })
      }
    }
    return $q.all(promises);;
  }

  function setEntityWeights(entities) {
    var promises = [];

    for(entityType in entities){
      if(entities.hasOwnProperty(entityType)){
        var arrayEntities = entities[entityType];
        angular.forEach(arrayEntities, function(entity) {
          var promise = $http({
              url   : 'api/entities/' + entity.id,
              method: 'POST',
              data  : {count: 1}
          });

          promises.push(promise);
        })
      }
    }

    return $q.all(promises);
    
  }

  $scope.addHypothesis = function() {
    $scope.hypotheses.push({x: 100, y: 100, weight: 5, name: "Hypothesis " + $scope.hypotheses.length});
  }
  $scope.addEvidence = function(wholeDocument) {
    var promises = [];
    var sentences = angular.element('.document-viewer .document-text .select-text');
    var evidence = {
      x: 100,
      y: 100,
      name: 'Evidence ' + $scope.evidences.length
    };
    var content = [];
    var evidenceEntities = {};
    $scope.entityTypes.forEach(function(entityType){
      evidenceEntities[entityType] = [];
    })

    if(!wholeDocument){
      sentences.each(function() {
        var snippet = {
          name: $scope.selectedDocument.name,
          text: this.innerHTML
        };
        content.push(snippet);
        var entities = getEntitiesInSentence(this.innerHTML);
        _.merge(evidenceEntities, entities, function(a, b) {
          // console.log(a, b);
          if (_.isArray(b)) {
            return a.concat(b);
          }
        });
        var promise = $http({
            url   : 'api/snippet',
            method: 'POST',
            data  : {
              snippet: snippet,
              entities: entities
            }
        });

        promises.push(promise);
        // weight += getWeightsOfEntities(entities);
      });
    }
    else{
      content = [];
      // weight = 0;
      content.push({
        name: $scope.selectedDocument.name,
        text: $scope.selectedDocument.parsedText
      });
      var entities = getEntitiesInSentence($scope.selectedDocument.parsedText);
      _.merge(evidenceEntities, entities, function(a, b) {
        // console.log(a, b);
        if (_.isArray(b)) {
          return a.concat(b);
        }
      });
      // var promise = $http({
      //     url   : 'api/snippet/',
      //     method: 'POST',
      //     data  : {
      //       snippet: content,
      //       entities: entities
      //     }
      // });

      // promises.push(promise);
      // weight += getWeightsOfEntities(entities);
    }
    $q.all(promises)
      .then(function(snippets) {
        snippets = snippets.map(function(snippet) { return snippet.data; });
        getEntitiesForEvidence(evidenceEntities)
          .then(function(entities) {
            entities = entities.map(function(entity) { return entity.data[0] });
            var weight = 0;
            angular.forEach(entities, function(entity) {
              weight += entity.properties.weight;
            });
            evidence.weight = weight;
            var promise = $http({
                url   : 'api/evidences',
                method: 'POST',
                data  : {
                  evidence: evidence,
                  snippets: snippets
                }
            });

            promise.then(function() {
              evidence.content = content;
              $scope.evidences.push(evidence);
              $scope.ach.updateACH();
            })
            // evidence.entities = evidenceEntities;
          });
      // });
      })
  }
}