var a = {
				is: 'variables-view',
				behaviors:" [Behaviors.AppConnectionBehavior]",
				properties: "%7B%0A%09%09%09%09%09searchIcon:%20%7B%0A%09%09%09%09%09%09value:%20'search'%0A%09%09%09%09%09%7D,%0A%09%09%09%09%09variablesFilter:%20%7B%0A%09%09%09%09%09%09value:%20%7B%0A%09%09%09%09%09%09%09filter:%20function%20(item)%20%7B%0A%09%09%09%09%09%09%09%09return%20true;%0A%09%09%09%09%09%09%09%7D%0A%09%09%09%09%09%09%7D%0A%09%09%09%09%09%7D,%0A%09%09%09%09%09sessionVariables:%20Array,%0A%09%09%09%09%09selectedSessionVariable:%20Object,%0A%09%09%09%09%09variableTypes:%20Array,%0A%09%09%09%09%09searchString:%20String,%0A%09%09%09%09%09variables:%20Array,%0A%09%09%09%09%09disabled:%20Boolean,%0A%09%09%09%09%09variableToCopy:%20Object,%0A%09%09%09%09%09processId:%20String,%0A%09%09%09%09%09sessionVarName:%20String,%0A%09%09%09%09%09sessionVarType:%20Object,%0A%09%09%09%09%09type:%20Object%0A%09%09%09%09%7D",
				listeners: {
					'selection-changed': '_selectionChanged',
					'new-child-variable': '_newChildVariable',
					'copy-variable': '_copyVariable'
				},
				ready: function () {
					this.variableTypes = this.getVariableTypes();
					this.sessionVariables = this.getSessionVariables();
				},
				_getValue: function (variable) {
					if (variable.type === 2048) {
						return variable.name;
					}
					return variable.value;
				},
				_searchInputKeyUp: function (e) {
					if (e.keyCode === 13) {
						this.set('searchString', e.target.value);
						if (!!this.searchString) {
							this.searchIcon = 'clear';
						} else {
							this.searchIcon = 'search';
						}
					}
				},
				_showValue: function (item) {
					return item.type === 2048;
				},
				_doSearchAction: function () {
					this.set('searchString', this.$$('#searchInput').value);
					if (this.searchIcon === 'search') {
						this.searchIcon = 'clear';
					} else {
						this.$$('#searchInput').value = '';
						this.set('searchString', '');
						this.searchIcon = 'search';
					}
				},
				_newChildVariable: function (e, data) {
					e.stopPropagation();
					this._newVariable(data.type, data.parentId);
				},
				_new: function (e) {
					this.$$('#addVariableDropdown').close();
					this._newVariable(e.model.__data.item.numeric);
				},
				_newVariable: function (type, parentId) {
					this.appendTo = parentId;
					this.type = type;
					this.$.getNewVariableRequest.generateRequest();
				},
				_onNewVariable: function (e, data) {
					var variable = data.variable;
					variable.isNew = true;
					if (!!this.appendTo) {
						this._push('variables', this.variables, variable);
						this.appendTo = null;
					} else {
						this.push('variables', variable);
					}
					this.$$('variables-table').focus(variable.id);
				},
				_getType: function (type) {
					return type;
				},
				_push: function (path, variables, variable) {
					for (var i = 0; i < variables.length; i++) {
						if (variables[i].id === this.appendTo) {
							if (!variables[i].value) {
								variables[i].value = [];
							}
							this.push(path + '.' + i + '.value', variable);
							return;
						}
						if (variables[i].type === 2048) {
							this._push(path + '.' + i + '.value', variables[i].value, variable);
						}
					}
				},
				deleteVariable: function (id) {
					this._deleteVariable('variables', this.variables, id);
				},
				_deleteVariable: function (path, variables, id) {
					for (var i = 0; i < variables.length; i++) {
						if (variables[i].id === id) {
							this.splice(path, i, 1);
							return;
						}
						if (variables[i].type === 2048) {
							this._deleteVariable(path + '.' + i + '.value', variables[i].value, id);
						}
					}
				},
				_importSessionVariable: function () {
					var sessionVariable = this.sessionVariables[this.selectedSessionVariable];
					if (!sessionVariable) {
						return;
					}
					this.sessionVarType = sessionVariable.Type;
					this.sessionVarName = sessionVariable.Name;
					this.$.getNewSessionVariableRequest.generateRequest();
				},
				_showSessionVariablesModal: function () {
					if (this.disabled) {
						return;
					}
					this.$.sessionVariablesDialog.toggle();
				},
				validateVariableNames: function () {
					return this.$$('variables-table').getElementsByClassName("invalid-input").length == 0;
				},
				_copyVariable: function(e, data) {
					this.variableToCopy = data;
					this.$$('#copyVariableRequest').generateRequest();
				}
			}