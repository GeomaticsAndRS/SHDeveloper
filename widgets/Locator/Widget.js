define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/Color',
    'dojo/dom',
    'dojo/on',
    'dojo/dom-construct',
    'dijit/registry',
    'dijit/form/Select',
    'dijit/form/Textarea',
    'dojo/parser',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/tasks/FeatureSet',
    'esri/symbols/PictureMarkerSymbol',
    'esri/InfoTemplate',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/geometry/Point',
    'jimu/BaseWidget'
], function (declare,
             lang, array, Color, dom, on, domConstruct, registry, Select, Textarea, parser,
             query, QueryTask, FeatureSet, PictureMarkerSymbol, InfoTemplate, SimpleFillSymbol, SimpleLineSymbol,Point,
             BaseWidget) {

    var clazz = declare([BaseWidget], {
        //these two properties are defined in the BaseWiget
        baseClass: 'locator',
        name: 'Locator',
        isFirst: 0,
        selectPerson: null,
        textInfo: null,
        bigPersonSymbol: null,
        smallPersonSymbol: null,
        infoTemplate: null,
        flashInterval: null,
        flashArray: [],

        // add additional properties here

        postCreate: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            // tags:
            //      private
            this.inherited(arguments);
            console.log('Locator::postCreate', arguments);

            // add additional post constructor logic here
            this.initWidget();
            this.initData();
        },

        // start up child widgets
        startup: function () {
            // summary:
            //      Overrides method of same name in dijit._Widget.
            // tags:
            //      private
            this.inherited(arguments);
            console.log('Locator::startup', arguments);
        },

        onOpen: function () {
            // summary:
            //      Overrides method of same name in jimu._BaseWidget.
            console.log('Locator::onOpen', arguments);
            // add code to execute whenever the widget is opened
        },

        onClose: function () {
            // summary:
            //      Overrides method of same name in jimu._BaseWidget.
            console.log('Locator::onClose', arguments);

            // add code to execute whenever the widget is closed
            this.cancelFlash(this.flashArray);
            this.map.graphics.clear();

        },
        initWidget: function () {
            this.selectPerson = new Select({}, this.personsNode);
            this.textInfo = new Textarea({
                disabled: true
            }, this.personalInfo);
        },
        initData: function () {
            var options = [];
            var q = new query();
            q.outFields = [this.config.queryFields];
            q.outSpatialReference = this.map.spatialReference;
            q.returnGeometry = this.config.returnGeometry;
            q.where = this.config.queryWhere;
            var queryTask = new QueryTask(this.config.queryTaskUrl);
            queryTask.execute(q,
                lang.hitch(this, function (featureSet) {
                    var option = '';
                    var features = featureSet.features;
                    for (var i = 0; i < features.length; i++) {
                        if (i === 0) {
                            option = {
                                value: features[i].attributes.Location,
                                label: features[i].attributes.Location,
                                selected: true
                            };
                            options.push(option);
                        } else {
                            option = {
                                value: features[i].attributes.Location,
                                label: features[i].attributes.Location
                            };
                            options.push(option);
                        }
                    }
                    /*domAttr.set(this.selectPerson,'options',options);*/
                    this.selectPerson.set('options', options);
                    this.selectPerson.set('intermediateChanges', true);

                    this.selectPerson.startup();
                    on(this.selectPerson, 'change', lang.hitch(this, this.displayInfos));
                    //aspect.after(this.selectPerson, 'Change', this.displayInfos(this));
                }),
                lang.hitch(this, function (error) {
                    alert(error);
                }));
        },
        doAdjust: function (num) {

            if (num === 0) {
                num++;
                this.displayInfos();
            }
            else {
                this.displayInfos();
            }
        },
        displayInfos: function (evt) {
            this.map.graphics.clear();
            this.textInfo.innerHTML = "";
            var that = this;
            var value = this.selectPerson.get('value');
            this.bigPersonSymbol = new PictureMarkerSymbol({
                "url": "./widgets/Locator/images/3DWalk32.png",
                "width": 20,
                "height": 20,
                "type": "esriPMS"
            });
            this.smallPersonSymbol = new PictureMarkerSymbol({
                "url": "./widgets/Locator/images/3DWalk32.png",
                "width": 32,
                "height": 32,
                "type": "esriPMS"
            });
            this.infoTemplate = new InfoTemplate("分站位置： ${Location}",
                "位置： ${Location}<br/>标号： ${ID}<br/>分站人数： ${Number}");
            var q = new query();
            q.outFields = [this.config.queryFields];
            q.outSpatialReference = this.map.spatialReference;
            q.returnGeometry = true;
            q.where = this.config.queryPersonWhere + value + "'";
            var queryTask = new QueryTask(this.config.queryTaskUrl);
            queryTask.execute(q,
                lang.hitch(this, function (featureSet) {
                    console.log(featureSet);
                    var features = featureSet.features;
                    array.forEach(features, function (feature) {
                        feature.setSymbol(that.bigPersonSymbol).setInfoTemplate(that.infoTemplate);
                        //地图归中
                        var point=new Point(feature.geometry.x,feature.geometry.y,that.map.spatialReference);
                        that.map.centerAt(point);
                        //不用监听
                        //on(this,'close',that.cancelFlash(that.flashArray));
                        that.cancelFlash(that.flashArray);
                        that.map.graphics.add(feature);
                        var i = 0;
                        this.flashInterval = setInterval(function () {
                            i++;
                            if (i % 2 === 0) {
                                that.map.graphics.remove(feature);
                            }
                            else {
                                that.map.graphics.add(feature);
                            }
                        }, 500);
                        that.flashArray.push(this.flashInterval);
                        that.textInfo.set('innerHTML', "标号: " + feature.attributes.ID + "                 "
                        + "分站人数：" + feature.attributes.Number);
                    });
                }),
                lang.hitch(this, function (error) {
                    alert(error);
                }));
        },
        cancelFlash: function (array) {
            if (array.length === 0) {
                console.log("no setInterval");
            }
            else {
                for (var i = 0; i <= array.length; i++) {
                    console.log("Now setInterval is " + array[i]);
                    window.clearInterval(array[i]);
                }
            }
        },
        personFlash: function (feature, symbol1, symbol2) {
            setInterval();
            setTimeout(function () {
                feature.setSymbol(symbol1);
                this.map.graphics.add(feature);
            }, 100);
            setTimeout(function () {
                feature.setSymbol(symbol2);
                this.map.graphics.add(feature);
            }, 100);
        }

    });

    return clazz;
});