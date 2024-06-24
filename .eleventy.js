const markdownIt = require("markdown-it");

module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy({"src/assets": "assets"});
    eleventyConfig.addPassthroughCopy({"src/css": "css"});
    eleventyConfig.addPassthroughCopy({"src/fonts": "fonts"});
    eleventyConfig.addPassthroughCopy({"src/img": "img"});
    eleventyConfig.addPassthroughCopy({"src/places": "places"});
    eleventyConfig.addPassthroughCopy({"src/js": "js"});

    let markdownLibrary = markdownIt({
        html: true,
        breaks: true,
        linkify: true
    });
    eleventyConfig.setLibrary("md", markdownLibrary);

    eleventyConfig.addFilter("capitalize", function(str) {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    });

    return {
        dir: {
            input: "src",
            data: "_data",
            output: "public",
            includes: "_includes",
            layouts: "_includes"
        },
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
        dataTemplateEngine: "njk",
        passthroughFileCopy: true
    };
};
