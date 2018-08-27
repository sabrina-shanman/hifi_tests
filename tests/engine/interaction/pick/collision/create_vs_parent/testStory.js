if (typeof PATH_TO_THE_REPO_PATH_UTILS_FILE === 'undefined') PATH_TO_THE_REPO_PATH_UTILS_FILE = "https://raw.githubusercontent.com/highfidelity/hifi_tests/master/tests/utils/branchUtils.js";
Script.include(PATH_TO_THE_REPO_PATH_UTILS_FILE);
var autoTester = createAutoTester(Script.resolvePath("."));
Script.include(autoTester.getUtilsRootPath() + "test_stage.js");
// Shared script code for collision pick tests
Script.include(Script.resolvePath(autoTester.getTestsRootPath() + "/engine/interaction/pick/collision/shared.js"));

autoTester.perform("Test capsule CollisionPick on server", Script.resolvePath("."), "secondary", function(testType) {
    var createdEntities = [];
    var createdPicks = [];
    var createdOverlays = [];
    var scriptIntervals = [];
    // These overlays are created specifically to visualize entity/avatar intersections
    var collisionPointOverlays = [];
    // So each collision pick visualization has its own array
    var collisionPointOverlays2 = [];
    // TODO: Figure out why this value is not being respected
    var maxCollisionPoints = 50;
    
    // Needed because the pick is centered around its y coordinate, while our overlays and avatar have their dimensions start at some y coordinate and go upward
    function getOffsetToPickPos(capsuleHeight) {
        return { x : 0, y : capsuleHeight*0.5, z: 0 };
    }
    function getOffsetFromPickPos(capsuleHeight) {
        return Vec3.subtract({x:0,y:0,z:0}, getOffsetToPickPos(capsuleHeight));
    }
    
    var bodyJointIndex = MyAvatar.getJointIndex("body");
    var mouseJointPick = 0;
    var rightHandJointPick = 0;
    
    function getCapsulePlacementPick() {
        if (rightHandJointPick == 0) {
            rightHandJointPick = createTestPick(createdPicks, PickType.Ray, {
                enabled: true,
                filter: Picks.PICK_AVATARS | Picks.PICK_ENTITIES,
                joint: "_CAMERA_RELATIVE_CONTROLLER_LEFTHAND"
            });
            Picks.setIgnoreItems(rightHandJointPick, [MyAvatar.sessionUUID]);
        }
        return rightHandJointPick;
    }
    
    // Get the position to be used by the test capsule pick
    function getTestCapsulePickPos(capsuleHeight) {
        var pickToUse = getCapsulePlacementPick();
        var result = Picks.getPrevPickResult(pickToUse);
        if (result.intersection == undefined) {
            return Vec3.ZERO;
        }
        var pointingAt = result.intersection;
        // Pick result location + capsule half-height offset + small y increase to prevent colliding with a flat ground
        return Vec3.sum(Vec3.sum(pointingAt, getOffsetToPickPos(capsuleHeight)), { x:0, y:0.01, z:0 });
    }
    
    function createTestCapsulePickAtPos(createdPicks, capsuleRadius, capsuleHeight, pos, ori) {
        var capsuleTestPick = createTestPick(createdPicks, PickType.Collision, {
            enabled: true,
            filter: Picks.PICK_ENTITIES + Picks.PICK_AVATARS,
            shape: {
                shapeType: "capsule-y",
                dimensions: { x: capsuleRadius*2.0, y: capsuleHeight-(capsuleRadius*2.0), z: capsuleRadius*2.0 }
            },
            position: pos,
            orientation: ori
        });
        Picks.setIgnoreItems(capsuleTestPick, [MyAvatar.sessionUUID]);
        
        return capsuleTestPick;
    }
    
    function clearScriptIntervals(scriptIntervals) {
        for (var i = 0; i < scriptIntervals.length; i++) {
            var interval = scriptIntervals[i];
            Script.clearInterval(interval);
        }
        scriptIntervals.length = 0;
    }
    
    function createCollisionPointOverlay(collisionPointOverlays) {
        var overlay = createOverlay(collisionPointOverlays, "shape", {
            shape: "Sphere",
            dimensions: { x: 0.1, y: 0.1, z: 0.1 },
            isSolid: true,
            drawInFront: true
        });
        return overlay;
    }
    
    var capsuleHeight = 2.0;
    var capsuleRadius = 0.25;
    var cylinderHeight = capsuleHeight - (capsuleRadius*2.0);
    var capsuleCollisionPointSize = 0.1;
    
    function visualizeCapsulePickWithoutParenting(showCollisionPoints, collisionPointOverlays) {
        // Platform overlay at the very bottom which serves as the parent of the other overlays
        var baseOverlay = createOverlay(createdOverlays, "shape", {
            shape: "Quad",
            alpha: 0.2,
            dimensions: { x: capsuleRadius*2.0, y: 0.1, z: capsuleRadius*2.0 },
            position: getTestCapsulePickPos(capsuleHeight)
        });
        // These overlays will have their position and color updated to match the previous pick result
        var lowerSphere = createOverlay(createdOverlays, "shape", {
            parentID: baseOverlay,
            shape: "Sphere",
            dimensions: { x: capsuleRadius, y: capsuleRadius, z: capsuleRadius },
            localPosition: {x:0, y:capsuleRadius, z:0}
        });
        var cylinder = createOverlay(createdOverlays, "shape", {
            parentID: baseOverlay,
            shape: "Cylinder",
            dimensions: { x: capsuleRadius*2.0, y: cylinderHeight, z: capsuleRadius*2.0 },
            localPosition: {x:0, y:capsuleRadius+(cylinderHeight*0.5), z:0}
        });
        var upperSphere = createOverlay(createdOverlays, "shape", {
            parentID: baseOverlay,
            shape: "Sphere",
            dimensions: { x: capsuleRadius, y: capsuleRadius, z: capsuleRadius },
            localPosition: {x:0, y:capsuleRadius + cylinderHeight, z:0}
        });
        var pickVisualizationOverlays = [lowerSphere, cylinder, upperSphere]
        
        var capsuleTestPick = createTestCapsulePickAtPos(createdPicks, capsuleRadius, capsuleHeight, getTestCapsulePickPos(capsuleHeight), Quat.IDENTITY);
        
        addScriptInterval(scriptIntervals, 8, function() {
            // Get result from previous pick and destroy/replace with a new pick since parenting isn't implemented yet
            var result = Picks.getPrevPickResult(capsuleTestPick);
            // Remove the pick, but keep it in the list of createdPicks to ensure proper cleanup later
            Picks.removePick(capsuleTestPick);
            capsuleTestPick = createTestCapsulePickAtPos(createdPicks, capsuleRadius, capsuleHeight, getTestCapsulePickPos(capsuleHeight), Quat.IDENTITY);
            
            // Use overlay to visualize previous pick result
            // When there is not enough time to get the result, the result may be empty, so we need to check for that
            if (result.collisionRegion != undefined) {
                updatePickVisualization(baseOverlay, pickVisualizationOverlays, result, getOffsetFromPickPos(capsuleHeight));
                
                if (showCollisionPoints) {
                    visualizeCollisionPoints(collisionPointOverlays, result.intersectingObjects, capsuleCollisionPointSize, maxCollisionPoints);
                }
            }
        });
    }
    
    function visualizeCapsulePickWithParenting(showCollisionPoints, collisionPointOverlays) {
        // Platform overlay at the very bottom which serves as the parent of the other overlays
        var baseOverlay = createOverlay(createdOverlays, "shape", {
            shape: "Quad",
            alpha: 0.2,
            dimensions: { x: capsuleRadius*2.0, y: 0.1, z: capsuleRadius*2.0 },
            position: { x:0, y:0, z:0 }
        });
        // These overlays will have their position and color updated to match the previous pick result
        var lowerSphere = createOverlay(createdOverlays, "shape", {
            parentID: baseOverlay,
            shape: "Sphere",
            dimensions: { x: capsuleRadius, y: capsuleRadius, z: capsuleRadius },
            localPosition: {x:0, y:capsuleRadius, z:0}
        });
        var cylinder = createOverlay(createdOverlays, "shape", {
            parentID: baseOverlay,
            shape: "Cylinder",
            dimensions: { x: capsuleRadius*2.0, y: cylinderHeight, z: capsuleRadius*2.0 },
            localPosition: {x:0, y:capsuleRadius+(cylinderHeight*0.5), z:0}
        });
        var upperSphere = createOverlay(createdOverlays, "shape", {
            parentID: baseOverlay,
            shape: "Sphere",
            dimensions: { x: capsuleRadius, y: capsuleRadius, z: capsuleRadius },
            localPosition: {x:0, y:capsuleRadius + cylinderHeight, z:0}
        });
        var pickVisualizationOverlays = [lowerSphere, cylinder, upperSphere]
        
        var parentRayPick = createTestPick(createdPicks, PickType.Ray, {
            enabled: true,
            filter: Picks.PICK_ENTITIES + Picks.PICK_AVATARS,
            joint: "_CAMERA_RELATIVE_CONTROLLER_RIGHTHAND"
        });
        
        var capsuleTestPick = createTestPick(createdPicks, PickType.Collision, {
            enabled: true,
            filter: Picks.PICK_ENTITIES + Picks.PICK_AVATARS,
            shape: {
                shapeType: "capsule-y",
                dimensions: { x: capsuleRadius*2.0, y: capsuleHeight-(capsuleRadius*2.0), z: capsuleRadius*2.0 }
            },
            position: Vec3.sum({x:0, y:0.01, z:0}, getOffsetToPickPos(capsuleHeight)),
            parentID: parentRayPick
        });
        Picks.setIgnoreItems(parentRayPick, [MyAvatar.sessionUUID]);
        Picks.setIgnoreItems(capsuleTestPick, [MyAvatar.sessionUUID]);
        
        addScriptInterval(scriptIntervals, 8, function() {
            var result = Picks.getPrevPickResult(capsuleTestPick);
            
            // Use overlay to visualize previous pick result
            // When there is not enough time to get the result, the result may be empty, so we need to check for that
            if (result.collisionRegion != undefined) {
                updatePickVisualization(baseOverlay, pickVisualizationOverlays, result, getOffsetFromPickPos(capsuleHeight));
                
                if (showCollisionPoints) {
                    visualizeCollisionPoints(collisionPointOverlays, result.intersectingObjects, capsuleCollisionPointSize, maxCollisionPoints);
                }
            }
        });
    }
    
    function cleanup() {
        clearScriptIntervals(scriptIntervals);
        clearEntities(createdEntities);
        clearTestPicks(createdPicks);
        clearOverlays(createdOverlays);
        clearOverlays(collisionPointOverlays);
        clearOverlays(collisionPointOverlays2);
        mouseJointPick = 0;
        rightHandJointPick = 0;
    }
    
    Script.scriptEnding.connect(cleanup);
    
    autoTester.addStep("Visualize pick with and without parenting", function () {
        cleanup();
        visualizeCapsulePickWithoutParenting(true, collisionPointOverlays);
        visualizeCapsulePickWithParenting(true, collisionPointOverlays2);
    });
    
    autoTester.addStep("Clean up after test", function () {
        cleanup();
    });
    
    var result = autoTester.runTest(testType);
});