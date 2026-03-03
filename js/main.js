// agrow midterm - main.js
// By Ray Weigand

require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",

  "esri/layers/FeatureLayer",
  "esri/layers/TileLayer",

  "esri/widgets/Locate",
  "esri/widgets/Search",
  "esri/widgets/BasemapGallery",
  "esri/widgets/LayerList",
  "esri/widgets/Expand",
  "esri/widgets/Editor"
], function (
  esriConfig,
  Map,
  MapView,

  FeatureLayer,
  TileLayer,

  Locate,
  Search,
  BasemapGallery,
  LayerList,
  Expand,
  Editor
) {

  // ---------------------------
  // API key
  // ---------------------------
  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurEzkBozXZgPgjPozCzklawWD863C9mArHp4QeXfLaiy8L2BJTmm_eFlkRBmh-rS8f86DIaVxCZv1qDyzDjRyrQtKAoG97CplbDXiwWMA2bYqtEAxH9-MHlA3tDGSjUp93BMOHIaqXguOZxzW8cFVKszpoaoEbOPaECd9FiSLY6Rg-2FBhrb9bssxhS2Mh6EcsLusRR-qwO3qSJK5S8_0-lU3r-pdC0akyfo2hyekjELXAT1_Mj7DoXAA";

  // ---------------------------
  // AGOL layer URLs
  // ---------------------------
  var fieldDataUrl =
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/field_data/FeatureServer/0";

  var usersLandUrl =
    "https://services.arcgis.com/HRPe58bUyBqyyiCt/arcgis/rest/services/Users_Land/FeatureServer/0";

  // ---------------------------
  // map + layers
  // ---------------------------
  var map = new Map({
    basemap: "arcgis-imagery"
  });

  var usersLandLayer = new FeatureLayer({
    url: usersLandUrl,
    title: "My Land",
    outFields: ["*"]
  });

  var fieldDataLayer = new FeatureLayer({
    url: fieldDataUrl,
    title: "Field Data",
    outFields: ["*"]
  });

  map.addMany([usersLandLayer, fieldDataLayer]);

  // ---------------------------
  // insight overlays (toggle on/off)
  // ---------------------------
  var hillshadeLayer = new TileLayer({
    url: "https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer",
    title: "Hillshade",
    opacity: 0.55,
    visible: false
  });

  // slope overlay is a placeholder for now (keeping midterm scope realistic)
  var slopeLayer = new TileLayer({
    url: "https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer",
    title: "Slope",
    opacity: 0.0,
    visible: false
  });

  map.addMany([hillshadeLayer, slopeLayer]);

  // ---------------------------
  // view
  // ---------------------------
  var view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-89.4, 43.07],
    zoom: 10
  });

  // ---------------------------
  // widgets
  // ---------------------------
  var locateWidget = new Locate({ view: view });
  var searchWidget = new Search({ view: view });

  var basemapGallery = new BasemapGallery({
    view: view,
    source: [
      { id: "arcgis-imagery", title: "Imagery" },
      { id: "arcgis-topographic", title: "Topographic" }
    ]
  });

  var layerList = new LayerList({ view: view });

  var bgExpand = new Expand({
    view: view,
    content: basemapGallery,
    expanded: false
  });

  var llExpand = new Expand({
    view: view,
    content: layerList,
    expanded: false
  });

  view.ui.add(locateWidget, "top-left");
  view.ui.add(bgExpand, "top-left");
  view.ui.add(llExpand, "top-left");
  view.ui.add(searchWidget, "top-right");

  // ---------------------------
  // editor (add + update)
  // ---------------------------
  view.when(function () {
    var editor = new Editor({
      view: view,
      layerInfos: [
        {
          layer: usersLandLayer,
          formTemplate: {
            title: "Add / Edit Land",
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
          formTemplate: {
            title: "Add / Edit Field Data",
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
      expanded: false
    });

    view.ui.add(editorExpand, "top-left");
  });

  // ---------------------------
  // sidebar filters (for points)
  // ---------------------------
  var obsFilter = document.getElementById("obsFilter");
  var statusFilter = document.getElementById("statusFilter");
  var severityFilter = document.getElementById("severityFilter");
  var cropFilter = document.getElementById("cropFilter");
  var clearBtn = document.getElementById("clearFilters");

  // match the domains you set in AGOL
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

  // label -> code (stored value is 1-5)
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
      opt.value = String(v.code);
      opt.textContent = v.label;
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
    var whereParts = [];

    if (obsFilter.value) {
      whereParts.push("obs_type = '" + safeText(obsFilter.value) + "'");
    }

    if (statusFilter.value) {
      whereParts.push("status = '" + safeText(statusFilter.value) + "'");
    }

    if (severityFilter.value) {
      whereParts.push("severity = " + severityFilter.value);
    }

    if (cropFilter.value) {
      whereParts.push("crop_type = '" + safeText(cropFilter.value) + "'");
    }

    fieldDataLayer.definitionExpression = whereParts.length
      ? whereParts.join(" AND ")
      : "1=1";
  }

  obsFilter.addEventListener("change", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  severityFilter.addEventListener("change", applyFilters);
  cropFilter.addEventListener("change", applyFilters);

  clearBtn.addEventListener("click", function () {
    obsFilter.value = "";
    statusFilter.value = "";
    severityFilter.value = "";
    cropFilter.value = "";
    fieldDataLayer.definitionExpression = "1=1";
  });

});
