function slugify(text, sep) {
  sep = sep || '-';
  return text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, sep);
}
exports.slugify = slugify;
