// src/lib/pannellum-shim.js
// Loads the UMD bundle so it attaches window.pannellum, then exports it.
import 'pannellum/build/pannellum.js';

const pannellum = window.pannellum;
export default pannellum;
