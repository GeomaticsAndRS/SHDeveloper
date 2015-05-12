define([
  'dojo/_base/declare',
    'dojo/_base/lang',
  'dojo/parser',
  'dojo/on',
  'dojo/dom',
  'dojo/dom-construct',
    'dojo/dom-attr',
  'dijit/form/Select',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/geometry/Point',
  'jimu/BaseWidget'
], function(
  declare,lang,parser,on,dom,domConstruct,domAttr,
  Select,
  Query,QueryTask,Point,
  BaseWidget
) {

  var clazz = declare([BaseWidget], {
    //these two properties are defined in the BaseWiget
    baseClass: 'videos',
    name: 'Videos',

    // add additional properties here
    videosList:null,
    currentVideo:null,

    postCreate: function() {
      // summary:
      //      Overrides method of same name in dijit._Widget.
      // tags:
      //      private
      this.inherited(arguments);
      console.log('Videos::postCreate', arguments);
      // add additional post constructor logic here

    },

    // start up child widgets
    startup: function() {
      // summary:
      //      Overrides method of same name in dijit._Widget.
      // tags:
      //      private
      this.inherited(arguments);
      console.log('Videos::startup', arguments);
    },

    onOpen: function() {
      // summary:
      //      Overrides method of same name in jimu._BaseWidget.
      console.log('Videos::onOpen', arguments);

      // add code to execute whenever the widget is opened
      this.initWidget();
      this.initData();
    },

    onClose: function() {
      // summary:
      //      Overrides method of same name in jimu._BaseWidget.
      console.log('Videos::onClose', arguments);

      // add code to execute whenever the widget is closed
    },
    initWidget:function(){
      this.videosList=new Select({},this.videoListNode);
      // this.currentVideo=dom.byId('videoNode');
      console.log(this.videoNode);
      domAttr.set(this.videoNode,"height",this.config.videos.height);
      domAttr.set(this.videoNode,"width",this.config.videos.width);
      domAttr.set(this.videoNode,"controls",this.config.videos.controls);
      domAttr.set(this.videoNode,"autoplay",this.config.videos.autoplay);
      //domAttr.set(this.videoNode,"src",this.config.videos.testSrc);
      /*this.videoNode.set("height",this.config.videos.height)
          .set("width",this.config.videos.width)
          .set("controls",this.config.videos.controls);*/
    },
    initData:function(){
      var options = [];
      var query=new Query();
      query.outFields = [this.config.queryConditions.queryFields.NAME];
      query.outSpatialReference = this.map.spatialReference;
      query.returnGeometry = this.config.queryConditions.returnGeometry;
      query.where = this.config.queryConditions.queryWhere;
      var queryTask=new QueryTask(this.config.queryConditions.queryTaskUrl);
      queryTask.execute(query,
          lang.hitch(this,function(featureSet){
            var option = '';
            var features = featureSet.features;
            for (var i = 0; i < features.length; i++) {
              if (i === 0) {
                option = {
                  value: i+1,
                  label: features[i].attributes.NAME,
                  selected: true
                };
                options.push(option);
              } else {
                option = {
                  value: i+1,
                  label: features[i].attributes.NAME
                };
                options.push(option);
              }
            }
            console.log(options);
            this.videosList.set('options',options);
            this.videosList.set('intermediateChanges',true);
            this.videosList.startup();
            on(this.videosList,'change',lang.hitch(this,this.displayVideo));
          }),
          lang.hitch(this,function(error){
            alert(error);
          }));
    },
    displayVideo:function(evt){
      var videoValue=this.videosList.get('value');
      var query=new Query();
      query.outFields = [this.config.queryConditions.queryFields.NAME];
      query.outSpatialReference = this.map.spatialReference;
      query.returnGeometry = this.config.queryConditions.returnGeometry;
      query.where = this.config.queryConditions.queryExtentWhere+videoValue+"'";
      var queryTask=new QueryTask(this.config.queryConditions.queryTaskUrl);
      console.log("将地图中心设置为视屏点中心！");
      queryTask.execute(query,
          lang.hitch(this,function(featureSet){
            var that=this;
            var features=featureSet.features;
            console.log(features);
            var point=new Point(features[0].geometry.x,features[0].geometry.y,that.map.spatialReference);
            that.map.centerAt(point);
            //that.map.centerAndZoom(point,2);
            /*that.map.setLevel(1);*/
          }),
          lang.hitch(this,function(error){
            alert(error);
          }));
      domAttr.set(this.videoNode,"src",this.config.videos.srcPre+videoValue+".mp4");
    }
  });

  return clazz;
});