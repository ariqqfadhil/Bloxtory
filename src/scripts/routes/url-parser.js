const UrlParser = {
  parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1).toLowerCase() || "/";
    const cleanUrl = url.split("?")[0];
    return cleanUrl;
  },
};

export default UrlParser;
