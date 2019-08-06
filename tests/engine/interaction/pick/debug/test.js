// Test 1: Ray pick / Laser pointer introspection

var center = { x: 0, y: 0, z: 0 };
var pickStart = { x: 0, y: 2, z: 0 };
var originalPointer;
var copyPointer;

function cleanup() {
    if (originalPointer !== undefined) {
        Pointers.removePointer(originalPointer);
    }
    if (copyPointer !== undefined) {
        Pointer.removePointer(copyPointer);
    }
}

// Create original laser pointer
function(){
    originalPointer = Pointers.createPointer(PickType.Ray, {
        origin: pickStart,
        direction: { x: 0, y: -1, z: 0 },
        enabled: true,
        visible: false,
        collidesWith: entities
    });
}()

// Create second pointer based on the properties of the first, but make it visible instead
function() {
    var copyProperties = Pointers.getPointerProperties(originalPointer);
    copyProperties.visble = true;
    copyPointer = Pointers.createPointer(copyProperties.pickType, copyProperties);
}()

// Take snapshot. Second pointer should be in the same position as the first
function() {
}()

Script.ending.connect(cleanup);
