require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",

  "esri/layers/FeatureLayer",

  "esri/widgets/Search",
  "esri/widgets/Locate",
  "esri/widgets/BasemapGallery",
  "esri/widgets/LayerList",
  "esri/widgets/Editor",
  "esri/widgets/Expand",

  "esri/geometry/geometryEngine"
], function (
  esriConfig,
  Map,
  MapView,
  FeatureLayer,
  Search,
  Locate,
  BasemapGallery,
  LayerList,
  Editor,
  Expand,
  geometryEngine
) {

  // ----------------------------------------------------
  // quick settings
  // ----------------------------------------------------
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  // hosted layers (you already made these)
  var usersLandUrl = "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Users_Land/FeatureServer/0";
  var fieldDataUrl  = "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/field_data/FeatureServer/0";

  // ----------------------------------------------------
  // layers
  // ----------------------------------------------------
  var usersLandLayer = new FeatureLayer({
    url: usersLandUrl,
    title: "My Land",
    outFields: ["*"],
    popupEnabled: true,
    popupTemplate: {
      title: "{land_name}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "land_owner", label: "Owner" },
            { fieldName: "crop_type", label: "Crop Type" },
            { fieldName: "acres", label: "Acres" }
          ]
        }
      ]
    }
  });

  // make points easier to see on imagery
  var fieldDataLayer = new FeatureLayer({
  url: fieldDataUrl,
  title: "Field Data",
  outFields: ["*"],

  // color by status + size by severity
  renderer: {
    type: "unique-value",
    field: "status",

    defaultSymbol: {
      type: "simple-marker",
      style: "circle",
      size: 10,
      color: [120,120,120],
      outline: { color: [255,255,255], width: 1 }
    },

    uniqueValueInfos: [
      {
        value: "Open",
        symbol: {
          type: "simple-marker",
          color: [255,80,80],
          outline: { color:[255,255,255], width:1 }
        }
      },
      {
        value: "In Progress",
        symbol: {
          type: "simple-marker",
          color: [255,190,80],
          outline: { color:[255,255,255], width:1 }
        }
      },
      {
        value: "Monitoring",
        symbol: {
          type: "simple-marker",
          color: [100,180,255],
          outline: { color:[255,255,255], width:1 }
        }
      },
      {
        value: "Closed",
        symbol: {
          type: "simple-marker",
          color: [120,210,120],
          outline: { color:[255,255,255], width:1 }
        }
      }
    ],

    visualVariables: [
      {
        type: "size",
        field: "severity",
        stops: [
          { value: 1, size: 8 },
          { value: 3, size: 10 },
          { value: 5, size: 12 }
        ]
      }
    ]
  },

  popupEnabled: true,
  popupTemplate: {
      title: "{title}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "obs_type", label: "Observation Type" },
            { fieldName: "status", label: "Status" },
            { fieldName: "severity", label: "Severity" },
            { fieldName: "crop_type", label: "Crop Type" },
            { fieldName: "obs_notes", label: "Notes" }
          ]
        }
      ]
    }
  });

  // ----------------------------------------------------
  // map + view
  // ----------------------------------------------------
  var map = new Map({
    basemap: "satellite",
    layers: [usersLandLayer, fieldDataLayer]
  });

  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-89.4, 43.07],
    zoom: 9
  });

  // ----------------------------------------------------
  // widgets: top-right = search, locate, zoom
  // ----------------------------------------------------
  var searchWidget = new Search({
    view: view
  });

  view.ui.add(searchWidget, "top-right");

  var locateWidget = new Locate({
    view: view
  });

  view.ui.add(locateWidget, "top-right");

  // move zoom to top-right (under search)
  view.ui.move("zoom", "top-right");

  // ----------------------------------------------------
  // widgets: left side (basemap, layers, editor)
  // ----------------------------------------------------
  
// basemap gallery (only imagery + topo)
var basemapGallery = new BasemapGallery({
  view: view,
  source: [
    { basemap: "satellite", title: "Imagery" },
    { basemap: "topo-vector", title: "Topographic" }
  ]
});

var basemapExpand = new Expand({
  view: view,
  content: basemapGallery,
  expandTooltip: "Basemaps"
});

view.ui.add(basemapExpand, "top-left");

  var layerList = new LayerList({
    view: view
  });

  var layersExpand = new Expand({
    view: view,
    content: layerList,
    expandTooltip: "Layers",
    collapseTooltip: "Layers"
  });

  view.ui.add(layersExpand, "top-left");

  var editor = new Editor({
    view: view
  });

  var editorExpand = new Expand({
    view: view,
    content: editor,
    expandTooltip: "Edit / Add",
    collapseTooltip: "Edit / Add"
  });

  view.ui.add(editorExpand, "top-left");

  // ----------------------------------------------------
  // sidebar filter stuff
  // ----------------------------------------------------
  var obsTypeSelect = document.getElementById("obsTypeSelect");
  var statusSelect = document.getElementById("statusSelect");
  var severitySelect = document.getElementById("severitySelect");
  var cropTypeSelect = document.getElementById("cropTypeSelect");

  var searchBtn = document.getElementById("searchBtn");
  var clearBtn = document.getElementById("clearBtn");

  function fillSelectFromDomain(selectEl, layer, fieldName) {
    var f = layer.fields.find(function (fld) { return fld.name === fieldName; });
    if (!f || !f.domain || !f.domain.codedValues) return;

    // wipe old options except the first "All"
    while (selectEl.options.length > 1) selectEl.remove(1);

    f.domain.codedValues.forEach(function (cv) {
      var opt = document.createElement("option");
      opt.value = cv.code;
      opt.textContent = cv.name;
      selectEl.appendChild(opt);
    });
  }

  function applyFilters() {
    var whereParts = [];

    if (obsTypeSelect.value) whereParts.push("obs_type = '" + obsTypeSelect.value + "'");
    if (statusSelect.value) whereParts.push("status = '" + statusSelect.value + "'");
    if (severitySelect.value) whereParts.push("severity = " + severitySelect.value);
    if (cropTypeSelect.value) whereParts.push("crop_type = '" + cropTypeSelect.value + "'");

    var where = (whereParts.length > 0) ? whereParts.join(" AND ") : "1=1";
    fieldDataLayer.definitionExpression = where;
  }

  function clearFilters() {
    obsTypeSelect.value = "";
    statusSelect.value = "";
    severitySelect.value = "";
    cropTypeSelect.value = "";
    fieldDataLayer.definitionExpression = "1=1";
  }

  searchBtn.addEventListener("click", applyFilters);
  clearBtn.addEventListener("click", clearFilters);

  // ----------------------------------------------------
  // buttons that trigger the Editor workflows
  // ----------------------------------------------------
  var addFieldDataBtn = document.getElementById("addFieldDataBtn");
  var addLandBtn = document.getElementById("addLandBtn");

  function openEditorForLayer(layer) {
    // open the editor panel so the user sees the form
    editorExpand.expanded = true;

    // close other panels so it's not messy
    basemapExpand.expanded = false;
    layersExpand.expanded = false;

    // give it a second to be ready (this avoids some random weirdness)
    view.when(function () {
      if (!editor.viewModel) return;

      // pick the first template for that layer
      // (if there are multiple, ArcGIS will show choices)
      editor.viewModel.startCreateWorkflowAtFeatureType(layer);
    });
  }

  addFieldDataBtn.addEventListener("click", function () {
    openEditorForLayer(fieldDataLayer);
  });

  addLandBtn.addEventListener("click", function () {
    openEditorForLayer(usersLandLayer);
  });

  // ----------------------------------------------------
  // auto-calc acres AFTER a polygon is saved
  // (keeps it simple: we calculate and then update the new feature)
  // ----------------------------------------------------
  usersLandLayer.on("edits", function (evt) {
    // only care about new adds
    if (!evt || !evt.addedFeatures || evt.addedFeatures.length === 0) return;

    var added = evt.addedFeatures[0];
    if (!added || !added.objectId) return;

    // pull the geometry we just added (we need it to calc area)
    usersLandLayer.queryFeatures({
      objectIds: [added.objectId],
      returnGeometry: true,
      outFields: ["*"]
    }).then(function (res) {
      if (!res.features || res.features.length === 0) return;

      var feat = res.features[0];
      if (!feat.geometry) return;

      // geodesic area in sq meters -> acres
      var sqm = Math.abs(geometryEngine.geodesicArea(feat.geometry, "square-meters"));
      var acres = sqm / 4046.8564224;

      // round a little so it doesn't look crazy
      acres = Math.round(acres * 100) / 100;

      // update just the acres field
      usersLandLayer.applyEdits({
        updateFeatures: [{
          attributes: {
            OBJECTID: added.objectId,
            acres: acres
          }
        }]
      }).catch(function (err) {
        console.log("acres update failed", err);
      });
    }).catch(function (err) {
      console.log("query for acres failed", err);
    });
  });

  // ----------------------------------------------------
  // once layers load, populate filter dropdowns from domains
  // ----------------------------------------------------
  view.when(function () {
    // these come from your hosted layer domains
    fillSelectFromDomain(obsTypeSelect, fieldDataLayer, "obs_type");
    fillSelectFromDomain(statusSelect, fieldDataLayer, "status");
    fillSelectFromDomain(severitySelect, fieldDataLayer, "severity");

    // crop_type exists on both layers, but we just use fieldData domain for filtering
    fillSelectFromDomain(cropTypeSelect, fieldDataLayer, "crop_type");
  });

});