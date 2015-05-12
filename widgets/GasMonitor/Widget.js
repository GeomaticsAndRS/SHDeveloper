//var  originalPoints=[];
define(['dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'dojo/dom',
        'dojo/dom-attr',
        'dojo/dom-class',
        'dojo/on',
        'dojo/topic',
        'dojo/_base/Color',
        'dojo/dom-style',
        'dijit/form/Form',
        'dojox/layout/TableContainer',
        'dijit/form/Button',
        'dijit/form/TextBox',
        'dijit/registry',
        'esri/tasks/query',
        'esri/tasks/QueryTask',
        'esri/tasks/FeatureSet',
        'esri/tasks/Geoprocessor',
        'esri/geometry/Point',
        'esri/graphic',
        'esri/InfoTemplate',
        'esri/SpatialReference',
        'esri/geometry/Geometry',
        'esri/layers/FeatureLayer',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/PictureMarkerSymbol',
        'esri/renderers/ClassBreaksRenderer',
        'jimu/BaseWidget'],
    function (declare, lang, array, dom,domAttr,domClass, on,topic,Color,domStyle,
              Form, TableContainer, Button, TextBox,registry,
              Query, QueryTask, FeatureSet, Geoprocessor, Point, Graphic,InfoTemplate,SpatialReference,
              Geometry,FeatureLayer,SimpleFillSymbol,SimpleLineSymbol,PictureMarkerSymbol,ClassBreaksRenderer,
              BaseWidget) {
        //To create a widget, you need to derive from BaseWidget.
        return declare([BaseWidget], {

            // Custom widget code goes here

            baseClass: 'gas-monitor',
            // this property is set by the framework when widget is loaded.
            // name: 'GasMonitor',
            // add additional properties here
            gasTable: null,
            gp: null,
            originalPoints: null,
            nowPoints: [],
            newPoint: null,
            windowInterval: null,
            i: null,
            j:null,
            pointValue: null,
            obj:null,
            firstExtent:null,
            redSymbol:null,
            greenSymbol:null,
            stopValue:null,
            addBig:null,
            gasInfo:null,


            //methods to communication with app container:
            postCreate: function () {
                this.inherited(arguments);
                console.log('GasMonitor::postCreate');
                this.iniWidget();
                this.initData();

            },

            startup: function () {
                this.inherited(arguments);
                console.log('GasMonitor::startup');
            },

            onOpen: function () {
                console.log('GasMonitor::onOpen');
                this.doGP();
            },

            onClose: function () {
                console.log('GasMonitor::onClose');
                //退出的时候将底图之上的的动态要素清空
                //clearInterval();
                this.map.graphics.clear();
                topic.subscribe("stop",function(){
                    clearInterval(this.stopValue);
                })
            },

            onMinimize: function () {
                console.log('GasMonitor::onMinimize');
            },

            onMaximize: function () {
                console.log('GasMonitor::onMaximize');
            },

            onSignIn: function (credential) {
                console.log('GasMonitor::onSignIn', credential);
            },

            onSignOut: function () {
                console.log('GasMonitor::onSignOut');
            },

            onPositionChange: function () {
                console.log('GasMonitor::onPositionChange');
            },

            resize: function () {
                console.log('GasMonitor::resize');
            },
            iniWidget: function () {
                this.gasTable = TableContainer({
                    cols: 2,//共两列
                    labelWidth: '100px'
                }, this.gasTableNode);
                this.gasTable.addChild(
                    new TextBox({
                        label: this.config.nameofMonitor,
                        value: this.config.nameofMonitor,
                        //name: feature.attributes.value,
                        trim: true,
                        disabled: true,
                        propercase: true,
                        colspan: 0,//占据两列
                        style: {width: '150px', margin: '5px 0 0 0;'}
                    })
                );
                this.gasTable.addChild(
                    new TextBox({
                        label: this.config.currentValue,
                        value: this.config.currentValue,
                        trim: true,
                        disabled: true,
                        propercase: true,
                        colspan: 0,//占据两列
                        style: {width: '150px', margin: '5px 0 0 0;'}
                    })
                );
            },
            initData: function () {
                this.queryFeatureSet(this.config.queryConditions, this.returnFeatureSet);
                //=new PictureMarkerSymbol('./widgets/GasMonitor/images/redWater.png', 20, 20);
                this.redSymbol = new PictureMarkerSymbol({
                    "url": "./widgets/GasMonitor/images/redWater.png",
                    "width": 20,
                    "height": 20,
                    "type": "esriPMS"
                });
                this.greenSymbol=new PictureMarkerSymbol({
                    "url": "./widgets/GasMonitor/images/greenWater.png",
                    "width": 20,
                    "height": 20,
                    "type": "esriPMS"
                });

            },
            /*
             * @con=this.config.queryConditions
             * @fun=function(){}*/
            queryFeatureSet: function (con, fun) {
                var query = new Query();
                query.outFields = ["*"];
                query.outSpatialReference = this.map.spatialReference;
                query.returnGeometry = con.returnGeometry;
                query.where = con.queryWhere;
                var queryTask = new QueryTask(con.queryTaskUrl);
                queryTask.execute(query,
                    lang.hitch(this, fun),
                    lang.hitch(this, function (error) {
                        alert("出错了  " + error);
                    }));

            },
            returnFeatureSet: function (featureSet) {
                var that = this;
                array.forEach(featureSet.features, function (feature) {
                    //监测站点
                    that.gasTable.addChild(
                        new TextBox({
                            label: feature.attributes.NAME,
                            value: feature.attributes.NAME,
                            name: feature.attributes.NAME,
                            id:feature.attributes.NAME,
                            trim: true,
                            disabled: true,
                            propercase: true,
                            colspan: 0,//占据两列
                            style: {width: '150px', margin: '5px 0 0 0;'}
                        })
                    );
                    //站点浓度
                    that.gasTable.addChild(
                        new TextBox({
                            label: feature.attributes.value,
                            value: feature.attributes.value,
                            id:feature.attributes.value+"ID",
                            trim: true,
                            //disabled: true,
                            //propercase: true,
                            colspan: 0,//占据两列
                            style: {width: '150px', margin: '5px 0 0 0;'}
                        })
                    );
                    //======================test======================================================
                    //var test=registry.byId('70ID');
                    //domStyle.set(feature.attributes.value+'ID','backgroundColor','red');
                });
            },
            doGP: function () {
                //根据随机value来生成gp动态效果
                this.queryFeatureSet(this.config.gp, this.processResult);
                //this.asyncGP();
                /*var params={"point":featureset};
                 this.gp.execute(params);*/
            },
            processResult: function (featureSet) {
                console.log(featureSet);
                //处理point
                this.originalPoints = featureSet;
                /*var that=this;
                array.forEach(featureSet.features, function (feature) {
                    lang.hitch(that.originalPoints.push(feature));
                });*/
                console.log("originalPoints的值："+this.originalPoints);
                //====================================================================GP1\
                //执行gp次数
                //for(var i=0;i<2;i++){
                //    //处理value
                //    if(i===0)
                //    {
                //        this.GP(featureSet);
                //    }
                //    else{
                //        for(var j=0;j<featureSet.features.length;j++)
                //        {
                //            featureSet.features[j].attributes.value+=5*(Math.random().toFixed(2));
                //        }
                //        setTimeout(this.GP(featureSet),10000);
                //    }
                //
                //}
                //===================================================================GP2
                this.i=0;
                //this.j=0;
                        var that = this;
                        topic.subscribe('to interval',function(){
                            clearInterval(that.windowInterval);
                        });
                        this.windowInterval = setInterval(function () {
                            that.i++;//GP执行次数
                            console.log("GP执行 "+that.i+"次");
                            if (that.i >10) {
                                topic.publish("to interval");
                            }
                            else{
                                //that.j++;
                                if(that.i===1){
                                    that.GP(featureSet);
                                }
                                else{
                                    //处理value
                                    console.log(that.i);
                                    //if(that.i==2){
                                    //that.map.graphics.clear();
                                        for(var a=0;a<featureSet.features.length;a++) {
                                            var fvalue=featureSet.features[a].attributes.value;
                                            var fstr=parseInt(fvalue).toString()+"ID";
                                            //var tab=registry.byId(fstr);
                                            var values=(featureSet.features[a].attributes.value+=5*(Math.random().toFixed(2)));
                                            that.changeValue(fstr,values);

                                        }
                                    that.GP(featureSet);
                                }
                            }
                        }, 3000);


            },
            GP:function(featureSet){
                /*this.map.graphics.clear();*/
                console.log("地图图形个数为"+this.map.graphics.graphics.length);
                this.gp = new Geoprocessor(this.config.gp.gpUrl);
                var params = {"point": featureSet};
                console.log("现在的值："+params,featureSet);
                this.gp.execute(params,
                    lang.hitch(this,function displayResult(results){
                        var that=this;
                        console.log("执行成功结果："+results[0].value);
                        /*array.forEach(results[0].value.features,function(feature){
                            var gra=new Graphic(feature.geometry,polygon);
                            that.map.graphics.add(gra);
                            gra=null;
                            console.log("stop");
                        });
                        results=null;*/
                        that.map.graphics.clear();
                        for(var a=0;a<results[0].value.features.length;a++)
                        {

                            var ft=results[0].value.features[a];
                            var color=ft.attributes.gridcode;
                            switch(color){
                                case 80:
                                    this.addGraphic(ft.geometry,0,245,0);
                                    break;
                                case 90:
                                    this.addGraphic(ft.geometry,50,205,50);
                                    break;
                                case 100:
                                    this.addGraphic(ft.geometry,124,252,0);
                                    break;
                                case 110:
                                    this.addGraphic(ft.geometry,245,139,0);
                                    break;
                                case 120:
                                    this.addGraphic(ft.geometry,245,102,0);
                                    break;
                                case 130:
                                    this.addGraphic(ft.geometry,245,69,0);
                                    break;
                                case 140:
                                    this.addGraphic(ft.geometry,245,33,0);
                                    break;
                                case 150:
                                    this.addGraphic(ft.geometry,245,0,0);
                                    this.firstGeometry=ft.geometry;
                                    break;
                                default:
                                    console.log("超出预期值");
                                    break;
                            }

                        }
                        //this.firstGeometry=results[0].value.features[0].geometry;
                        //console.log(this.firstGeometry);
                        //firstExtent.contains();
                        //取到gridcode为150的feature.geometry
                        that.addBig=5;
                        that.gasInfo=new InfoTemplate(that.config.infoPeople.title,that.config.infoPeople.content);
                        this.queryFeatureSet(that.config.people,function(peopleResults){
                            that.addBig+=5;
                            //var size=that.redSymbol.size+=that.addBig;

                            array.forEach(peopleResults.features,function readersymbol(feature){
                                if(that.firstGeometry.contains(feature.geometry)){
                                    that.redSymbol.setWidth(20+that.addBig);
                                    that.redSymbol.setHeight(20+that.addBig);
                                    //that.redSymbol.setSize(size);
                                    feature.setSymbol(that.redSymbol).setInfoTemplate(that.gasInfo);
                                    that.map.graphics.add(feature);
                                }
                                else{
                                    feature.setSymbol(that.greenSymbol).setInfoTemplate(that.gasInfo);
                                    that.map.graphics.add(feature);
                                }
                            })
                        })
                    }),
                    lang.hitch(this,function (error) {
                        alert("GP执行出错！！" + error);
                    }))
        },
            changeValue:function(id,value){
                    setInterval(function(){
                        /*var txtBox=registry.byId(id);
                        domStyle.set(txtBox,"backgroundColor","red");*/
                        var tab=$('#'+id);
                        tab.attr("label",value.toFixed(2));
                        tab.attr("value",value.toFixed(2));
                        tab.attr("id",parseInt(value)+"ID");
                        //tab.css("background-color","red");
                        /*domStyle.set(site1,{color:"green"});
                        site2.style.color="rgb(255,255,0)";
                        domStyle.set(site3,{backgroundColor:"red"});
                        site4.style.backgroundColor="rgb(255,0,255)";*/
                        var site1=document.getElementById('widget_70ID');
                        var site2=document.getElementById('widget_60ID');
                        var site3=document.getElementById('widget_120ID');
                        var site4=document.getElementById('widget_125ID');
                        var site5=document.getElementById('widget_150ID');

                        if(value<=70){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"blue"});
                            domStyle.set(site4,{backgroundColor:"blue"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }else if(value<=80){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"blue"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        else if(value<=90){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        else if(value<=100){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        else if(value<=110){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        else if(value<=120){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        else if(value<=130){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        else if(value<=140){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }else if(value>140){
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        else{
                            domStyle.set(site1,{backgroundColor:'green'});
                            domStyle.set(site2,{backgroundColor:"green"});
                            domStyle.set(site3,{backgroundColor:"red"});
                            domStyle.set(site4,{backgroundColor:"red"});
                            domStyle.set(site5,{backgroundColor:"red"});
                        }
                        tab=null;
                        values=null;
                    },5000);

            },
            addGraphic:function(geometry,r,g,b){
                var symbol=new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color([255,0,0]), 1),new Color([r,g,b,0.5]));
                var gra=new Graphic(geometry,symbol);
                this.map.graphics.add(gra);
                gra=null;


            },
            processPeople:function(peopleResults){
                //console.log("人员信息"+peopleResults);
            }

            //asyncGP: function () {
            //    //gp执行10次
            //    this.i = 0;
            //    var that = this;
            //    topic.subscribe('to interval',function(){
            //        clearInterval(that.windowInterval);
            //    });
            //    this.windowInterval = setInterval(function (i) {
            //        that.i++;
            //        console.log(that.i);
            //        if (that.i >2) {
            //            topic.publish("to interval");
            //        }
            //        else{
            //            that.intervalDO();
            //        }
            //    }, 3000);
            //},
            //intervalDO: function () {
            //    var that = this;
            //    this.nowPoints=[];
            //    array.forEach(this.originalPoints.features, function (point) {
            //        var gra = new Graphic();
            //        gra.setAttributes({
            //            "OBJECTID":point.attributes.OBJECTID,
            //            "ID":point.attributes.ID,
            //            "value":point.attributes.value ,//+= 5 * (Math.random().toFixed(2))
            //            "NAME":point.attributes.NAME
            //        });
            //        var geometry=new Geometry();
            //        geometry.spatialReference= new SpatialReference(2413);
            //        geometry.type = "point";
            //        geometry.x = point.geometry.x;
            //        geometry.y = point.geometry.y;
            //        gra.setGeometry(geometry);
            //        that.nowPoints.push(gra);
            //    });
            //    var  fieldAliases=new Object();
            //    fieldAliases["ID"]="标示";
            //    fieldAliases["Name"]="监测站名称";
            //    fieldAliases["OBJECTID"]="OBJECTID";
            //    fieldAliases["value"]="瓦斯浓度值";
            //    var fSet = new FeatureSet();
            //    fSet.displayFieldName="ID";
            //    fSet.features =that.nowPoints;
            //    fSet.geometryType='esriGeometryPoint';
            //    fSet.spatialReference =new SpatialReference(2413);
            //    fSet.fieldAliases=fieldAliases;
            //    /*that.obj=null;
            //    that.obj=new Object();
            //    that.obj['point']=fSet;*/
            //    //===============================GP==============================================
            //    this.gp = new Geoprocessor(this.config.gp.gpUrl);
            //    var params = {"point": fSet};
            //    console.log("现在的值："+params,fSet);
            //    this.gp.execute(params,
            //        lang.hitch(this,function displayResult(results){
            //            var that=this;
            //            console.log("执行成功结果："+results.value);
            //            var polygon=new SimpleFillSymbol();
            //            array.forEach(results[0].value.features,function(feature){
            //                var gra=new Graphic(feature.geometry,polygon);
            //                that.map.graphics.add(gra);
            //            })
            //
            //        }),
            //        lang.hitch(this,function (error) {
            //            alert("GP执行出错！！" + error);
            //        }));
            //    fSet=null;
            //}
            /*,
             //对得到的结果加以显示 然后在隐藏 刷新，
             displayResult: function (results) {

             }*/


//methods to communication between widgets:

        });


    });
