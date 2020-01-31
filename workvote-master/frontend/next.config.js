const withMDX = require('@zeit/next-mdx')({
  extension: /\.mdx?$/
});
const withFonts = require('next-fonts');
const withSass = require("@zeit/next-sass");

module.exports = withFonts(withSass(withMDX({
  pageExtensions: ['js', 'mdx', 'md'],
  target: "serverless"
})));

