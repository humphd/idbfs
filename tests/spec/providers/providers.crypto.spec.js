define(["IDBFS"], function(IDBFS) {

  // We reuse the same set of tests for all crypto providers.
  // buildTestsFor() creates a set of tests bound to a crypto
  // provider, and uses a Memory() provider internally.

  function buildTestsFor(wrapperName) {
    var passphrase = '' + Date.now();

    function createProvider() {
      var memoryProvider = new IDBFS.FileSystem.providers.Memory();
      return new IDBFS.FileSystem.providers[wrapperName](passphrase, memoryProvider);
    }

    describe("IDBFS.FileSystem.providers" + wrapperName, function() {
      it("is supported -- if it isn't, none of these tests can run.", function() {
        expect(IDBFS.FileSystem.providers[wrapperName].isSupported()).toEqual(true);
      });

      it("has open, getReadOnlyContext, and getReadWriteContext instance methods", function() {
        var indexedDBProvider = createProvider();
        expect(typeof indexedDBProvider.open).toEqual('function');
        expect(typeof indexedDBProvider.getReadOnlyContext).toEqual('function');
        expect(typeof indexedDBProvider.getReadWriteContext).toEqual('function');
      });

      describe("open an Memory provider", function() {
        it("should open a new Memory database", function() {
          var complete = false;
          var _error, _result;

          var provider = createProvider();
          provider.open(function(err, firstAccess) {
            _error = err;
            _result = firstAccess;
            complete = true;
          });

          waitsFor(function() {
            return complete;
          }, 'test to complete', DEFAULT_TIMEOUT);

          runs(function() {
            expect(_error).toEqual(null);
            expect(_result).toEqual(true);
          });
        });
      });

      describe("Read/Write operations on an Memory provider", function() {
        it("should allow put() and get()", function() {
          var complete = false;
          var _error, _result;

          var provider = createProvider();
          provider.open(function(err, firstAccess) {
            _error = err;

            var context = provider.getReadWriteContext();
            context.put("key", "value", function(err, result) {
              _error = _error || err;
              context.get("key", function(err, result) {
                _error = _error || err;
                _result = result;

                complete = true;
              });
            });
          });

          waitsFor(function() {
            return complete;
          }, 'test to complete', DEFAULT_TIMEOUT);

          runs(function() {
            expect(_error).toEqual(null);
            expect(_result).toEqual("value");
          });
        });

        it("should allow delete()", function() {
          var complete = false;
          var _error, _result;

          var provider = createProvider();
          provider.open(function(err, firstAccess) {
            _error = err;

            var context = provider.getReadWriteContext();
            context.put("key", "value", function(err, result) {
              _error = _error || err;
              context.delete("key", function(err, result) {
                _error = _error || err;
                context.get("key", function(err, result) {
                  _error = _error || err;
                  _result = result;

                  complete = true;
                });
              });
            });
          });

          waitsFor(function() {
            return complete;
          }, 'test to complete', DEFAULT_TIMEOUT);

          runs(function() {
            expect(_error).toEqual(null);
            expect(_result).toEqual(null);
          });
        });

        it("should allow clear()", function() {
          var complete = false;
          var _error, _result1, _result2;

          var provider = createProvider();
          provider.open(function(err, firstAccess) {
            _error = err;

            var context = provider.getReadWriteContext();
            context.put("key1", "value1", function(err, result) {
              _error = _error || err;
              context.put("key2", "value2", function(err, result) {
                _error = _error || err;

                context.clear(function(err) {
                  _error = _error || err;

                  context.get("key1", function(err, result) {
                    _error = _error || err;
                    _result1 = result;

                    context.get("key2", function(err, result) {
                      _error = _error || err;
                      _result2 = result;

                      complete = true;
                    });
                  });
                });
              });
            });
          });

          waitsFor(function() {
            return complete;
          }, 'test to complete', DEFAULT_TIMEOUT);

          runs(function() {
            expect(_error).toEqual(null);
            expect(_result1).toEqual(null);
            expect(_result2).toEqual(null);
          });
        });

        it("should fail when trying to write on ReadOnlyContext", function() {
          var complete = false;
          var _error, _result;

          var provider = createProvider();
          provider.open(function(err, firstAccess) {
            _error = err;

            var context = provider.getReadOnlyContext();
            context.put("key1", "value1", function(err, result) {
              _error = _error || err;
              _result = result;

              complete = true;
            });
          });

          waitsFor(function() {
            return complete;
          }, 'test to complete', DEFAULT_TIMEOUT);

          runs(function() {
            expect(_error).toBeDefined();
            expect(_result).toEqual(null);
          });
        });
      });
    });
  }

  buildTestsFor('AESWrapper');
  buildTestsFor('TripleDESWrapper');
  buildTestsFor('RabbitWrapper');

});