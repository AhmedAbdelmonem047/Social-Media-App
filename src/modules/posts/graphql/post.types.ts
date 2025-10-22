import { GraphQLEnumType, GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
import { ActionType } from "../post.validation";

export const actionEnumGQL = new GraphQLEnumType({
    name: "actionEnum",
    values: {
        like: { value: ActionType.like },
        unlike: { value: ActionType.unlike },
    }
})

export const postType = new GraphQLObjectType({
    name: "Post",
    fields: {
        content: { type: GraphQLString },
        attatchments: { type: new GraphQLList(GraphQLString) },
        assetFolderId: { type: GraphQLString },
        createdBy: { type: GraphQLID },
        tags: { type: new GraphQLList(GraphQLID) },
        likes: { type: new GraphQLList(GraphQLID) },
    }
})