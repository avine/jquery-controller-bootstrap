/* eslint-env jasmine */
/* global jQuery, loadFixtures, testGet */

describe('Test', function() {

  beforeEach(function() {
    jasmine.getFixtures().fixturesPath = 'base/test/fixtures/';
  });

  beforeEach(function() {
    loadFixtures('test.html');
  });

  it('should works!', function() {
    expect(testGet(4)).toEqual(4);
    expect(testGet(5)).toEqual(5);
    expect(testGet(6)).toEqual(6);
  });

  it('should traverse DOM!', function() {
    expect(jQuery('#my-fixture').length).toEqual(1);
  });

  it('should handle click!', function() {
    var x = 0, $a = jQuery('#my-click');

    $a.on('click', () => x++);

    $a.trigger('click');

    expect(x).toEqual(1);
  });

});
