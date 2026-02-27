from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def optimize_route(distance_matrix):
    """
    Optimizes the travel route to minimize total travel distance.
    Args:
        distance_matrix (list[list[int]]): 2D matrix of distances between locations.
    Returns:
        list: Optimal visiting order of place indices.
    """

    # Convert Google API output if needed
    if isinstance(distance_matrix, dict) and "rows" in distance_matrix:
        rows = distance_matrix["rows"]
        distance_matrix = [
            [elem["distance"]["value"] for elem in row["elements"]]
            for row in rows
        ]

    num_locations = len(distance_matrix)

    if num_locations <= 1:
        return {"error": "At least two locations are needed for optimization."}

    # Create the routing index manager
    manager = pywrapcp.RoutingIndexManager(num_locations, 1, 0)

    # Create Routing Model
    routing = pywrapcp.RoutingModel(manager)

    # Distance callback
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)

    # Set the cost
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Define search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )

    # Solve the problem
    solution = routing.SolveWithParameters(search_parameters)

    # Extract the route
    route = []
    if solution:
        index = routing.Start(0)
        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        route.append(manager.IndexToNode(index))

    return route
