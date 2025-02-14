//
// Created by Nissim Hadar on 2018/3/14
// Copyright 2013-2016 High Fidelity, Inc.
//
// Distributed under the Apache License, Version 2.0.
// See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

'use strict';

Script.include("./BenchmarkLib.js");
Resources.overrideUrlPrefix(TEST_ROOT, Script.resolvePath(".."));

var AVATAR_TRACING_RULES = "" + 
    "trace.*=true\n" +
    "*.detail=true\n" +
    "";

var testScript = new TestScript();

var testStart = {
    clearCaches: true,
    url: "hifi://dev-AvatarIsland.highfidelity.io/8000,8000,8000/0,0.0,0.0,1.0" 
};

testScript.addTest({
    name: "benchmarkDevAvatarIsland",
    
    loader: TestScript.locationLoader(testStart),
    
    tracingRules: AVATAR_TRACING_RULES,
    
    traceActions: TestScript.locationSteps([
        { dt: 30, pos:{ x: -84.0, y: -1.7, z: 18.2 }, ori:{ yaw: -63.9 }}     
    ]),
    
    duration: 30
});

testScript.runTests();
