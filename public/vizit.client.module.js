angular.module('vizit', ['app.core', 'app.widgets', 'app.documentviewer',
    'app.entityviewer', 'app.achmatrix', 'app.upload', 'ngMaterial', 'ui.router',
    'ngMdIcons', 'xeditable', 'gridshore.c3js.chart', 'nvd3']);
angular.module('vizit').run(function (editableOptions, editableThemes) {
    editableThemes['angular-material'] = {
        formTpl: '<form class="editable-wrap"></form>',
        noformTpl: '<span class="editable-wrap"></span>',
        controlsTpl: '<md-input-container class="editable-controls" ng-class="{\'md-input-invalid\': $error}"></md-input-container>',
        inputTpl: '',
        errorTpl: '<div ng-messages="{message: $error}"><div class="editable-error" ng-message="message">{{$error}}</div></div>',
        buttonsTpl: '<span class="editable-buttons"></span>',
        submitTpl: '<md-button type="submit" class="md-primary">save</md-button>',
        cancelTpl: '<md-button type="button" class="md-warn" ng-click="$form.$cancel()">cancel</md-button>'
    };

    editableOptions.theme = 'angular-material';
});