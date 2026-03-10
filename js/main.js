require([
  "esri/config",
  "esri/Map",
  "esri/views/MapView",

  "esri/layers/FeatureLayer",

  "esri/widgets/Search",
  "esri/widgets/Locate",
  "esri/Basemap",
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
  Basemap,
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
    // CHANGE NOTE (Mar 2026):
    // 1) Renamed polygon crop label to "Crop Type of Area" to distinguish it
    //    from point-level crop type in field-data popups.
    // 2) Added built-in ArcGIS attachments section so uploaded files appear at
    //    the bottom of regular popups as clickable links.
    popupTemplate: {
      title: "{land_name}",
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "land_owner", label: "Owner" },
            { fieldName: "crop_type", label: "Crop Type of Area" },
            { fieldName: "acres", label: "Acres" }
          ]
        },
        {
          type: "attachments",
          displayType: "list"
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
  // CHANGE NOTE (Mar 2026):
  // Added built-in attachments section to point popups so uploads are visible
  // at the bottom without overriding the normal field list behavior.
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
        },
        {
          type: "attachments",
          displayType: "list"
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
  view: view
});

var basemapExpand = new Expand({
  view: view,
  content: basemapGallery,
  expandTooltip: "Basemaps"
});

view.ui.add(basemapExpand, "top-left");

// fix basemap white-screen + thumbnails
view.when(function () {
  Promise.all([
    Basemap.fromId("arcgis-imagery"),
    Basemap.fromId("arcgis-topographic")
  ]).then(function (basemaps) {
    basemapGallery.source = basemaps;
  });
});

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

  // editor widget
var editor = new Editor({
  view: view
});

var editorExpand = new Expand({
  view: view,
  content: editor,
  expandTooltip: "Editor",
  collapseTooltip: "Editor"
});

view.ui.add(editorExpand, "top-left");

  // ----------------------------------------------------
  // sidebar filter stuff
  // ----------------------------------------------------
  var obsTypeSelect = document.getElementById("obsTypeSelect");
  var statusSelect = document.getElementById("statusSelect");
  var severitySelect = document.getElementById("severitySelect");
  var cropTypeSelect = document.getElementById("cropTypeSelect");
  var filterResultsText = document.getElementById("filterResultsText");
  var matchingFeatureList = document.getElementById("matchingFeatureList");

  var searchBtn = document.getElementById("searchBtn");
  var clearBtn = document.getElementById("clearBtn");

  function clearSelectOptions(selectEl) {
    while (selectEl.options.length > 1) selectEl.remove(1);
  }

  function getDomainValues(layer, fieldName) {
    var field = layer.fields && layer.fields.find(function (f) { return f.name === fieldName; });
    if (!field || !field.domain || !field.domain.codedValues) return [];

    return field.domain.codedValues.map(function (cv) {
      return { value: cv.code, label: cv.name };
    });
  }

  function getUniqueValuesFromFeatures(features, fieldName) {
    var found = {};
    var values = [];

    features.forEach(function (feature) {
      var val = feature.attributes[fieldName];
      if (val === null || val === undefined || val === "") return;

      var key = String(val);
      if (!found[key]) {
        found[key] = true;
        values.push({ value: val, label: String(val) });
      }
    });

    values.sort(function (a, b) {
      return String(a.label).localeCompare(String(b.label));
    });

    return values;
  }

  // CHANGE NOTE (Mar 2026):
  // Filter dropdowns originally stayed on "All" because some field metadata
  // and/or domains were not always available at initial load. This helper set
  // supports mixed sources (domains + queried feature values).
  function fillSelectFromPairs(selectEl, pairs) {
    clearSelectOptions(selectEl);

    var seen = {};
    pairs.forEach(function (pair) {
      var key = String(pair.value);
      if (seen[key]) return;
      seen[key] = true;

      var opt = document.createElement("option");
      opt.value = pair.value;
      opt.textContent = pair.label;
      selectEl.appendChild(opt);
    });
  }

  function toSqlLiteral(value) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }

  function getSelectedFilterValues() {
    return {
      obs_type: obsTypeSelect.value,
      status: statusSelect.value,
      severity: severitySelect.value,
      crop_type: cropTypeSelect.value
    };
  }

  function layerHasField(layer, fieldName) {
    return !!(layer.fields && layer.fields.some(function (f) { return f.name === fieldName; }));
  }

  // CHANGE NOTE (Mar 2026):
  // Builds a safe SQL where clause from selected filters.
  // If a selected field does not exist on a layer, we return "1=0" for that
  // layer to avoid invalid SQL and misleading counts.
  function buildWhereFromSelected(layer, selected) {
    var parts = [];

    Object.keys(selected).forEach(function (fieldName) {
      var value = selected[fieldName];
      if (!value) return;

      if (!layerHasField(layer, fieldName)) {
        parts.push("1=0");
        return;
      }

      parts.push(fieldName + " = " + toSqlLiteral(value));
    });

    if (parts.length === 0) return "1=1";
    if (parts.indexOf("1=0") !== -1) return "1=0";
    return parts.join(" AND ");
  }

  function updateFilterResults() {
    // CHANGE NOTE (Mar 2026):
    // Central summary updater for sidebar feedback.
    // - Counts matching points + areas
    // - Updates "No features fit those criteria." state
    // - Refreshes clickable matching point list
    var selected = getSelectedFilterValues();
    var pointsWhere = buildWhereFromSelected(fieldDataLayer, selected);
    var areasWhere = buildWhereFromSelected(usersLandLayer, selected);

    var matchingPointsQuery = fieldDataLayer.createQuery();
    matchingPointsQuery.where = pointsWhere;
    matchingPointsQuery.returnGeometry = true;
    matchingPointsQuery.outFields = ["OBJECTID", "title", "obs_notes"];

    Promise.all([
      fieldDataLayer.queryFeatureCount({ where: pointsWhere }),
      usersLandLayer.queryFeatureCount({ where: areasWhere }),
      fieldDataLayer.queryFeatures(matchingPointsQuery)
    ]).then(function (counts) {
      var pointCount = counts[0] || 0;
      var areaCount = counts[1] || 0;
      var matchingPoints = (counts[2] && counts[2].features) ? counts[2].features : [];
      var total = pointCount + areaCount;

      if (total === 0) {
        filterResultsText.textContent = "No features fit those criteria.";
      } else {
        filterResultsText.textContent = pointCount + " point feature(s) and " + areaCount + " area feature(s) fit those criteria.";
      }

      renderMatchingFeatureList(matchingPoints);
    }).catch(function () {
      filterResultsText.textContent = "Could not calculate matching feature counts.";
      renderMatchingFeatureList([]);
    });
  }

  function truncateSnippet(text, maxLength) {
    if (!text) return "No notes";
    var normalized = String(text).trim();
    if (normalized.length <= maxLength) return normalized;
    return normalized.slice(0, maxLength).trim() + "...";
  }

  function zoomToAndOpenFeature(feature) {
    view.goTo({ target: feature.geometry, zoom: 16 }).then(function () {
      view.popup.open({
        features: [feature],
        location: feature.geometry
      });
    }).catch(function () {
      view.popup.open({
        features: [feature],
        location: feature.geometry
      });
    });
  }

  // CHANGE NOTE (Mar 2026):
  // Renders the sidebar list of matching point features.
  // Clicking an item zooms to that point and opens its popup.
  function renderMatchingFeatureList(features) {
    matchingFeatureList.innerHTML = "";

    if (!features || features.length === 0) {
      var empty = document.createElement("p");
      empty.className = "feature-list-empty";
      empty.textContent = "No matching point features.";
      matchingFeatureList.appendChild(empty);
      return;
    }

    features.forEach(function (feature, idx) {
      var item = document.createElement("li");
      item.className = "feature-item";

      var number = document.createElement("span");
      number.className = "feature-index";
      number.textContent = String(idx + 1);

      var body = document.createElement("div");
      body.className = "feature-body";

      var title = document.createElement("p");
      title.className = "feature-title";
      title.textContent = feature.attributes.title || ("Feature " + (idx + 1));

      var snippet = document.createElement("p");
      snippet.className = "feature-snippet";
      snippet.textContent = truncateSnippet(feature.attributes.obs_notes, 90);

      body.appendChild(title);
      body.appendChild(snippet);

      item.appendChild(number);
      item.appendChild(body);

      item.addEventListener("click", function () {
        zoomToAndOpenFeature(feature);
      });

      matchingFeatureList.appendChild(item);
    });
  }

  // CHANGE NOTE (Mar 2026):
  // Populate dropdowns from both domains and live queried values.
  // This is intentionally resilient when service metadata is constrained.
  function populateFilterOptions() {
    return Promise.all([
      fieldDataLayer.when(),
      usersLandLayer.when(),
      view.whenLayerView(fieldDataLayer)
    ]).then(function (results) {
      var layerView = results[2];
      var q = layerView.createQuery();
      q.where = "1=1";
      q.returnGeometry = false;
      q.outFields = ["obs_type", "status", "severity", "crop_type"];

      return layerView.queryFeatures(q).then(function (result) {
        var features = result.features || [];

        var obsValues = getDomainValues(fieldDataLayer, "obs_type")
          .concat(getUniqueValuesFromFeatures(features, "obs_type"));
        var statusValues = getDomainValues(fieldDataLayer, "status")
          .concat(getUniqueValuesFromFeatures(features, "status"));
        var severityValues = getDomainValues(fieldDataLayer, "severity")
          .concat(getUniqueValuesFromFeatures(features, "severity"));

        var cropValues = getDomainValues(fieldDataLayer, "crop_type")
          .concat(getDomainValues(usersLandLayer, "crop_type"))
          .concat(getUniqueValuesFromFeatures(features, "crop_type"));

        fillSelectFromPairs(obsTypeSelect, obsValues);
        fillSelectFromPairs(statusSelect, statusValues);
        fillSelectFromPairs(severitySelect, severityValues);
        fillSelectFromPairs(cropTypeSelect, cropValues);
      });
    }).catch(function (err) {
      console.error("Could not populate filter options:", err);
    });
  }

  function applyFilters() {
    var selected = getSelectedFilterValues();
    var where = buildWhereFromSelected(fieldDataLayer, selected);
    fieldDataLayer.definitionExpression = where;
    updateFilterResults();
  }

  function clearFilters() {
    obsTypeSelect.value = "";
    statusSelect.value = "";
    severitySelect.value = "";
    cropTypeSelect.value = "";
    fieldDataLayer.definitionExpression = "1=1";
    updateFilterResults();
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

  // CHANGE NOTE (Mar 2026):
  // Guard optional editor button hooks to prevent null addEventListener errors
  // when those buttons are not present in index.html.
  if (addFieldDataBtn) {
    addFieldDataBtn.addEventListener("click", function () {
      openEditorForLayer(fieldDataLayer);
    });
  }

  if (addLandBtn) {
    addLandBtn.addEventListener("click", function () {
      openEditorForLayer(usersLandLayer);
    });
  }

  // ----------------------------------------------------
  // CHANGE NOTE (Mar 2026):
  // Auto-calculate accurate polygon area in acres
  // ----------------------------------------------------
  // This helper function calculates the accurate geodesic area of a polygon
  // and converts it to acres. Used for both create and update operations.
  // 
  // Calculation steps:
  // 1. Use ArcGIS geodesicArea to get true surface area in square meters
  //    (accounts for Earth's curvature, more accurate than planar calculation)
  // 2. Convert square meters to acres using standard conversion factor
  //    1 acre = 4046.8564224 square meters
  // 3. Round to 2 decimal places for display
  function calculateAndUpdateAcres(graphic) {
    if (!graphic || !graphic.geometry) return;

    // Calculate polygon area in square meters using geodesic measurement
    var sqm = Math.abs(
      geometryEngine.geodesicArea(graphic.geometry, "square-meters")
    );

    // Convert to acres (1 acre = 4046.8564224 square meters)
    var acres = sqm / 4046.8564224;

    // Round to 2 decimal places for readability
    acres = Math.round(acres * 100) / 100;

    // Prepare attribute update with calculated acres
    var oidField = usersLandLayer.objectIdField;
    var attrs = {};
    attrs[oidField] = graphic.attributes[oidField];
    attrs.acres = acres;

    // Update the acres field on the saved feature
    usersLandLayer.applyEdits({
      updateFeatures: [{ attributes: attrs }]
    });
  }

  // Auto-calculate acres when a new land polygon is created
  editor.viewModel.on("create", function (evt) {
    // Only run once drawing is finished
    if (evt.state !== "complete") return;

    calculateAndUpdateAcres(evt.graphic);
  });

  // Auto-recalculate acres when an existing polygon is edited/resized
  // This ensures acres stay accurate even after geometry modifications
  editor.viewModel.on("update", function (evt) {
    // Only run once editing is finished
    if (evt.state !== "complete") return;

    // Only recalculate for land polygons from usersLandLayer
    if (evt.graphic && evt.graphic.layer === usersLandLayer) {
      calculateAndUpdateAcres(evt.graphic);
    }
  });

  // CHANGE NOTE (Mar 2026):
  // Auto-calculate acres for existing polygons when popup opens
  // This ensures all polygons (even those created before this code was added)
  // display accurate acreage in their popups.
  view.popup.watch("selectedFeature", function (graphic) {
    if (!graphic) return;
    
    // Only process land polygons from usersLandLayer
    if (graphic.layer !== usersLandLayer) return;
    
    // Check if acres field is missing, null, or zero
    var currentAcres = graphic.attributes && graphic.attributes.acres;
    if (currentAcres === null || currentAcres === undefined || currentAcres === 0) {
      // Calculate and update acres for this polygon
      calculateAndUpdateAcres(graphic);
      
      // Refresh the popup to show the newly calculated value
      setTimeout(function () {
        if (view.popup.selectedFeature === graphic) {
          view.popup.reposition();
        }
      }, 500);
    }
  });

  // ----------------------------------------------------
  // once layers load, populate filter dropdowns from domains
  // ----------------------------------------------------
  // CHANGE NOTE (Mar 2026):
  // Initialize sidebar filter UX after layer/view readiness.
  // This ensures dropdown options + counts/list are ready on first load.
  populateFilterOptions().then(function () {
    updateFilterResults();
  });

});