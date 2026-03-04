// agrow midterm - main.js
// map + hosted layers + editor + a simple filter panel

require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",

  "esri/layers/FeatureLayer",
  "esri/Basemap",

  "esri/widgets/Search",
  "esri/widgets/Locate",
  "esri/widgets/Zoom",

  "esri/widgets/BasemapGallery",
  "esri/widgets/LayerList",
  "esri/widgets/Editor",
  "esri/widgets/Expand",

  "esri/symbols/SimpleMarkerSymbol",
  "esri/renderers/SimpleRenderer"
], function (
  esriConfig,
  Map,
  MapView,

  FeatureLayer,
  Basemap,

  Search,
  Locate,
  Zoom,

  BasemapGallery,
  LayerList,
  Editor,
  Expand,

  SimpleMarkerSymbol,
  SimpleRenderer
) {

  // api key (same setup as labs)
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  // hosted layer urls
  var usersLandUrl =
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Users_Land/FeatureServer/0";

  var fieldDataUrl =
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/field_data/FeatureServer/0";

  // start map on imagery
  var map = new Map({
    basemap: "arcgis-imagery"
  });

  // land polygons
  var usersLandLayer = new FeatureLayer({
    url: usersLandUrl,
    title: "My Land",
    outFields: ["*"],
    popupTemplate: {
      title: "{land_name}",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "land_owner", label: "Owner" },
          { fieldName: "crop_type", label: "Crop Type" },
          { fieldName: "acres", label: "Acres" }
        ]
      }]
    }
  });

  // points (make them easier to see on imagery)
  var pointSym = new SimpleMarkerSymbol({
    style: "circle",
    size: 10,
    color: [0, 170, 255, 1],
    outline: { color: [255, 255, 255, 1], width: 1.5 }
  });

  var fieldDataLayer = new FeatureLayer({
    url: fieldDataUrl,
    title: "Field Data",
    outFields: ["*"],
    renderer: new SimpleRenderer({ symbol: pointSym }),
    popupTemplate: {
      title: "{title}",
      content: [{
        type: "fields",
        fieldInfos: [
          { fieldName: "obs_type", label: "Observation Type" },
          { fieldName: "status", label: "Status" },
          { fieldName: "severity", label: "Severity (1–5)" },
          { fieldName: "crop_type", label: "Crop Type" },
          { fieldName: "obs_notes", label: "Notes" }
        ]
      }]
    }
  });

  map.addMany([usersLandLayer, fieldDataLayer]);

  // view
  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-89.4, 43.07],
    zoom: 10
  });

  // top-right: search, then locate + zoom under it
  var searchWidget = new Search({ view: view });
  var locateWidget = new Locate({ view: view });
  var zoomWidget = new Zoom({ view: view });

  view.ui.add(searchWidget, "top-right");
  view.ui.add(locateWidget, { position: "top-right", index: 1 });
  view.ui.add(zoomWidget, { position: "top-right", index: 2 });

  // left stack tools: basemap -> layers -> editor
  var basemapGallery = new BasemapGallery({ view: view });
  var layerList = new LayerList({ view: view });

  // tooltips so hover isn't just "Expand"
  var basemapExpand = new Expand({
    view: view,
    content: basemapGallery,
    expanded: false,
    expandTooltip: "Basemaps",
    collapseTooltip: "Basemaps"
  });

  var layersExpand = new Expand({
    view: view,
    content: layerList,
    expanded: false,
    expandTooltip: "Layers",
    collapseTooltip: "Layers"
  });

  view.ui.add(basemapExpand, "top-left");
  view.ui.add(layersExpand, "top-left");

  // fix basemap white-screen + thumbnails by using real basemap objects
  // also add Light Gray Canvas as a clean option
  view.when(function () {
    Promise.all([
      Basemap.fromId("arcgis-imagery"),
      Basemap.fromId("arcgis-topographic")
    ]).then(function (basemaps) {
      basemapGallery.source = basemaps;
    });
  });

  // editor
  view.when(function () {
    var editor = new Editor({
      view: view,
      allowedWorkflows: ["create", "update"],
      layerInfos: [
        {
          layer: usersLandLayer,
          label: "Add Land",
          formTemplate: {
            title: "Add Land",
            elements: [
              { type: "field", fieldName: "land_name", label: "Land Name" },
              { type: "field", fieldName: "land_owner", label: "Owner" },
              { type: "field", fieldName: "crop_type", label: "Crop Type" },
              { type: "field", fieldName: "acres", label: "Acres" }
            ]
          }
        },
        {
          layer: fieldDataLayer,
          label: "Add Field Data",
          formTemplate: {
            title: "Add Field Data",
            elements: [
              { type: "field", fieldName: "title", label: "Title" },
              { type: "field", fieldName: "obs_type", label: "Observation Type" },
              { type: "field", fieldName: "status", label: "Status" },
              { type: "field", fieldName: "severity", label: "Severity" },
              { type: "field", fieldName: "crop_type", label: "Crop Type" },
              { type: "field", fieldName: "obs_notes", label: "Notes" },
              { type: "field", fieldName: "Land_ID", label: "Land ID (optional)" }
            ]
          }
        }
      ]
    });

    var editorExpand = new Expand({
      view: view,
      content: editor,
      expanded: false,
      expandTooltip: "Editor",
      collapseTooltip: "Editor"
    });

    view.ui.add(editorExpand, "top-left");
  });

  // ---------------------------
  // sidebar filters
  // (these match your domain values)
  // ---------------------------
  var obsFilter = document.getElementById("obsFilter");
  var statusFilter = document.getElementById("statusFilter");
  var severityFilter = document.getElementById("severityFilter");
  var cropFilter = document.getElementById("cropFilter");
  var searchBtn = document.getElementById("searchBtn");
  var clearBtn = document.getElementById("clearFilters");

  var obsTypes = [
    "Vegetation Health",
    "Nutrients",
    "Disease",
    "Pest",
    "Soil Quality",
    "Irrigation",
    "Erosion",
    "Infrastructure",
    "Livestock",
    "General",
    "Other"
  ];

  var statuses = ["Open", "In Progress", "Monitoring", "Closed"];

  var severityOptions = [
    { label: "Minimal", code: 1 },
    { label: "Low", code: 2 },
    { label: "Moderate", code: 3 },
    { label: "High", code: 4 },
    { label: "Critical", code: 5 }
  ];

  var cropTypes = [
    "Corn",
    "Soybean",
    "Wheat",
    "Potatoes",
    "Alfalfa",
    "Specialty Crop",
    "Cover Crop",
    "Pasture",
    "Other"
  ];

  function addOptions(selectEl, values) {
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    });
  }

  function addSeverityOptions(selectEl, values) {
    values.forEach(function (v) {
      var opt = document.createElement("option");
      opt.value = String(v.code);      // stored value is numeric (1-5)
      opt.textContent = v.label;       // displayed label
      selectEl.appendChild(opt);
    });
  }

  addOptions(obsFilter, obsTypes);
  addOptions(statusFilter, statuses);
  addSeverityOptions(severityFilter, severityOptions);
  addOptions(cropFilter, cropTypes);

  function safeText(txt) {
    return txt.replace("'", "''");
  }

  function applyFilters() {
    var parts = [];

    if (obsFilter.value) {
      parts.push("obs_type = '" + safeText(obsFilter.value) + "'");
    }
    if (statusFilter.value) {
      parts.push("status = '" + safeText(statusFilter.value) + "'");
    }
    if (severityFilter.value) {
      parts.push("severity = " + severityFilter.value);
    }
    if (cropFilter.value) {
      parts.push("crop_type = '" + safeText(cropFilter.value) + "'");
    }

    fieldDataLayer.definitionExpression = parts.length ? parts.join(" AND ") : "1=1";
  }

  // "Search" applies filters (so it feels intentional)
  searchBtn.addEventListener("click", applyFilters);

  // clear resets everything
  clearBtn.addEventListener("click", function () {
    obsFilter.value = "";
    statusFilter.value = "";
    severityFilter.value = "";
    cropFilter.value = "";
    fieldDataLayer.definitionExpression = "1=1";
  });

});