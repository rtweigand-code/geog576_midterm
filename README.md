# Agrow – Agricultural Field Observation Web App

## Project Overview
Agrow is a web-based mapping application designed to help farmers and landowners log spatial observations directly on a map. Users can draw field boundaries, add observation points, and track information about what is happening across their land.

Although the app is mainly designed with agriculture in mind, realistically any land owner could use it to record spatial information about their property.

This project was developed as part of **GEOG 576 – Mobile Web Mapping**.

---

## Concept
In some ways this project is similar to tools like **Esri Field Maps**, where users collect spatial data and store it in a hosted database. However, my goal here was to create something more tailored toward farmers with a more guided workflow.

Instead of being a generic data collection tool, the application focuses on recording observations related to agricultural fields such as crop issues, pest sightings, irrigation problems, or general field monitoring.

---

## How the App Works

### Land Boundaries
Users can draw polygons representing fields or land parcels.  
When a polygon is created, the application automatically calculates the **area in acres** based on the geometry.

### Field Observations
Users can add point features to record observations occurring in the field.

Each observation stores information such as:

- Observation Type  
- Status  
- Severity  
- Crop Type  
- Notes  

Observations are symbolized on the map using different colors and sizes so issues can be identified quickly.

---

## Example Data
The application includes several example observations to demonstrate what user inputs might look like. These examples help show how farmers or landowners could use the app to track different types of field conditions.

Examples include things like pest sightings, crop stress, irrigation issues, and general monitoring observations.

---

## Technology Used

This project uses the following technologies:

- ArcGIS Maps SDK for JavaScript
- ArcGIS Online hosted feature layers
- HTML
- CSS
- JavaScript
- GitHub Pages for web hosting

I tried to focus on tools and workflows that I felt comfortable implementing through code while still demonstrating how a full-stack web mapping application can interact with a spatial database.

---

## Future Potential
Although this project is relatively simple, I think a concept like this could become much more powerful when paired with other spatial datasets.

For example, applications like this could be integrated with:

- remote sensing imagery  
- drone/UAV data  
- soil datasets  
- weather data  
- crop health indices such as NDVI  

Tools like this could potentially support modern agricultural practices such as **precision agriculture** and **regenerative agriculture**, where spatial monitoring plays a major role in land management decisions.

---

## Author
Ray Weigand  
University of Wisconsin–Madison  
GEOG 576 – Mobile Web Mapping  

---

## Live Application
GitHub Pages Link:  
https://rtweigand-code.github.io/geog576_midterm/
