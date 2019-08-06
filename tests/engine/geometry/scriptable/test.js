// Test scriptable mesh (do we already have a test for this?)

var cubeModelEntity;
var vertexVisualizationEntities = [];

var cubeModelEntityProperties = {
    
};
var vertexVisualizationProperties = {
    type: "Model",
    url: cubeModelURL,
    position: { x: 0, y: 0, z: 0 }
};


function cleanup() {
    if (cubeModelEntity !== undefined) {
        Entities.removeEntity(cubeModelEntity);
    }
    if (vertexVisualizationEntities.length != 0) {
        for (var i = 0; i < vertexVisualizationEntities.length; i++) {
            Entities.removeEntity(vertexVisualizationEntities[i]);
        }
    }
}

// Visualize vertices on a cube model
function(){
    // Spawn the cube model
    cubeModelEntity = Entites.createEntity(cubeModelEntityProperties);
    
    // This is somewhat inefficient, but helps us test that getIndices() works
    var indices = Graphics.getModel(entity).meshes[0].parts[0].getIndices();
    var indicesFoundIndividually = [];
    var vertices = [];
    var valid = true;
    Graphics.getModel(entity).meshes[0].parts[0].forEachVertex(function(attributes, index, meshPart){
        if (!valid) {
            return;
        }
        if (!indices.contains(index)) {
            valid = false;
            return;
        }
        if (!indicesFoundIndividually.contains(index) {
            indicesFoundIndividually.push(index);
            var vertex = attributes["position"];
            vertices.push(vertex);
        }
        
    });
    
    if (indices.length != indicesFoundIndividually.length) {
        valid = false;
    }
    
    if (valid) {
        var cubePosition = Entities.getEntityProperties(cubeEntity).position;
        for (int i = 0; i < vertices.length; i++) {
            var vertex = vertices[i];
            var properties = JSON.fromJSON(JSON.stringify(vertexVisualizationProperties));
            properties.position = Vec3.sum(cubePosition, vertex);
            vertexVisualizationEntities.push(Entities.addEntity(properties));
        }
    }
}()

Script.ending.connect(cleanup);
