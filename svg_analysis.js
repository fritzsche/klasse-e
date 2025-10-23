/**
 * svg_dimension_parser.js
 * A Node.js script to extract width and height from the root <svg> tag
 * using built-in string parsing.
 *
 * NOTE: This is a simplified parser and assumes the attributes are on the
 * first line within the root <svg> tag. For industrial-strength parsing,
 * a dedicated library like 'cheerio' or 'sax' is recommended.
 */

const fs = require('fs');

/**
 * Safely extracts a specific attribute value from an SVG tag string.
 * @param {string} tagString - The string of the root <svg> tag.
 * @param {string} attributeName - The name of the attribute (e.g., 'width').
 * @returns {string|null} The attribute value or null if not found.
 */
function extractAttribute(tagString, attributeName) {
    // Regex to find attributeName followed by an equals sign and quoted value
    // (handles single or double quotes, and optional spaces)
    const regex = new RegExp(`${attributeName}\\s*=\\s*["']([^"']*)["']`, 'i');
    const match = tagString.match(regex);
    return match ? match[1] : null;
}

/**
 * Extracts width, height, and viewBox from SVG content.
 * It prioritizes explicit width/height attributes. If those are missing,
 * it attempts to use the width and height values from the viewBox attribute
 * to determine the intrinsic aspect ratio.
 *
 * @param {string} svgContent - The full content of the SVG file.
 * @returns {object} An object containing the dimensions and source.
 */
function getSvgDimensions(svgContent) {
    // 1. Find the root <svg ... > tag at the start of the content (ignoring XML declaration)
    const svgMatch = svgContent.match(/<svg[^>]*>/i);

    if (!svgMatch) {
        return { error: "Could not find the root <svg> tag." };
    }

    const rootTag = svgMatch[0];

    // 2. Extract explicit dimensions and viewBox
    const width = extractAttribute(rootTag, 'width');
    const height = extractAttribute(rootTag, 'height');
    const viewBox = extractAttribute(rootTag, 'viewBox');

    let dimensions = {
        width: width,
        height: height,
        unit: 'unknown',
        viewBox: viewBox,
        source: (width || height) ? 'attributes' : 'none found'
    };

    // 3. Attempt to derive size from viewBox if width/height are missing
    if ((!width || !height) && viewBox) {
        const parts = viewBox.trim().split(/[\s,]+/);
        // viewBox is typically "min-x min-y width height" (4 parts)
        if (parts.length === 4) {
            const vbWidth = parts[2];
            const vbHeight = parts[3];

            if (!width) dimensions.width = vbWidth;
            if (!height) dimensions.height = vbHeight;

            dimensions.unit = 'unitless (from viewBox)';
            dimensions.source = 'viewBox aspect ratio';
        }
    }

    // 4. Determine unit for explicit dimensions (simple check)
    if (dimensions.source === 'attributes' && width) {
        dimensions.unit = width.match(/(%|px|em|rem|pt|in)$/i)?.[0] || 'unitless (default px)';
    }

    if (dimensions.width === null && dimensions.height === null) {
        return {
            width: null,
            height: null,
            viewBox: viewBox,
            source: 'none found',
            message: "Warning: No explicit 'width', 'height', or derivable 'viewBox' found. SVG will likely scale to its container."
        };
    }

    return dimensions;
}

// --- Main Execution Function ---

/**
 * Reads an SVG file and prints its dimensions.
 * @param {string} filePath - The path to the SVG file.
 */
function processSvgFile(filePath) {
    try {
        const svgContent = fs.readFileSync(filePath, 'utf8');
        console.log(`\n--- Analyzing File: ${filePath} ---`);
        const result = getSvgDimensions(svgContent);

        if (result.error) {
            console.error(`Error: ${result.error}`);
        } else {
            console.log(`[Status] Source of Dimensions: ${result.source}`);
            console.log(`[Width]   : ${result.width || 'N/A'}`);
            console.log(`[Height]  : ${result.height || 'N/A'}`);
            if (result.unit && result.unit !== 'unknown') {
                 console.log(`[Unit]    : ${result.unit}`);
            }
            if (result.viewBox) {
                console.log(`[ViewBox] : ${result.viewBox}`);
            }
            if (result.message) {
                console.log(`[Message] : ${result.message}`);
            }
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`\nError: File not found at path: ${filePath}`);
        } else {
            console.error(`\nAn error occurred while reading the file: ${error.message}`);
        }
    }
}

// --- Instructions and Usage ---

console.log("--- SVG Dimension Extractor (Node.js) ---");
console.log("To run this, save the code as 'svg_dimension_parser.js' and execute with 'node svg_dimension_parser.js'.");
console.log("You must provide the path to the SVG file(s) as command-line arguments.");
console.log("\nExample Usage: node svg_dimension_parser.js my_icon.svg another_logo.svg");

// Get file paths from command line arguments (excluding 'node' and script name)
const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
    console.log("\n--- No files provided. Running internal test cases instead. ---");

    // --- Internal Test Case 1: Explicit Dimensions (px) ---
    const testSvg1 = `<svg width="400px" height="300px" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg"><rect/></svg>`;
    console.log("\n[Test Case 1] Explicit Width/Height (400px x 300px):");
    console.log(getSvgDimensions(testSvg1));

    // --- Internal Test Case 2: ViewBox Aspect Ratio Only ---
    const testSvg2 = `<svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg"><circle/></svg>`;
    console.log("\n[Test Case 2] ViewBox Only (100 x 50 unitless):");
    console.log(getSvgDimensions(testSvg2));

    // --- Internal Test Case 3: Relative Dimensions (% and auto) ---
    const testSvg3 = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="auto" viewBox="0 0 1000 500"><path/></svg>`;
    console.log("\n[Test Case 3] Relative Dimensions (100% x auto), ViewBox 1000x500:");
    console.log(getSvgDimensions(testSvg3));

} else {
    // Process the files passed via command line
    filePaths.forEach(processSvgFile);
}

console.log("\n--- Processing Complete ---");
