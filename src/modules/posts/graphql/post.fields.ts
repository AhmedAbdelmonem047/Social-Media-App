import { GraphQLList, GraphQLString } from "graphql";
import * as postArgs from './post.args';
import postService from "../post.service";
import { postType } from "./post.types";


class postFields {
    constructor() { }
    query = () => {
        return {
            getAllPosts: {
                type: new GraphQLList(postType),
                resolve: postService.getAllPostsGQL
            },
            getAllPostsPaginated: {
                type: new GraphQLList(postType),
                args: postArgs.getAllPostsPaginated,
                resolve: postService.getAllPostsPaginatedGQL
            },
            likePost: {
                type: GraphQLString,
                args: postArgs.likePostGQL,
                resolve: postService.likePostGQL
            }
        }
    };
}

export default new postFields()