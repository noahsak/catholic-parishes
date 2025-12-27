// src/fixLeafletIcons.jsx
import L from "leaflet";

// Vite handles these asset imports automatically
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const fixLeafletIcons = () => {
  // Delete the internal method that tries to guess the path
  delete L.Icon.Default.prototype._getIconUrl;

  // Merge the correct resolved URLs from Vite
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  });
};

export default fixLeafletIcons;