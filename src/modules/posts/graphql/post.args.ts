import { GraphQLID, GraphQLInt, GraphQLNonNull } from "graphql";
import { actionEnumGQL } from "./post.types";


export const getAllPostsPaginated = {
    page: { type: GraphQLInt },
    limit: { type: GraphQLInt },
}

export const likePostGQL = {
    postId: { type: new GraphQLNonNull(GraphQLID) },
    action: { type: actionEnumGQL },
}