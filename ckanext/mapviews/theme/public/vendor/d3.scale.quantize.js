// Imported from d3js 3.4.1, commit b3d9f5e6

this.d3 = this.d3 || {};
this.d3.scale = this.d3.scale || {};

(function () {
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [start, stop] : [stop, start];
  }
  
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  
  this.d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [0, 1]);
  };
  
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
  
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
  
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
  
    scale.domain = function(x) {
      if (!arguments.length) return [x0, x1];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
  
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
  
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [y, y + 1 / kx];
    };
  
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range); // copy on write
    };
  
    return rescale();
  }
})();
