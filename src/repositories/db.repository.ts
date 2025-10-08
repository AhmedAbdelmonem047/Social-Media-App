import mongoose, { DeleteResult, HydratedDocument, Model, ProjectionType, QueryOptions, RootFilterQuery, UpdateQuery, UpdateWriteOpResult } from "mongoose";

export abstract class DbRepository<TDocumnet> {
    constructor(protected readonly model: Model<TDocumnet>) { }

    async create(data: Partial<TDocumnet>): Promise<HydratedDocument<TDocumnet>> {
        return await this.model.create(data);
    }
    async find(filter: RootFilterQuery<TDocumnet>, select?: ProjectionType<TDocumnet>, options?: QueryOptions<TDocumnet>): Promise<HydratedDocument<TDocumnet>[]> {
        return await this.model.find(filter, select, options);
    }
    async findOne(filter: RootFilterQuery<TDocumnet>, projection?: ProjectionType<TDocumnet>, options?: QueryOptions<TDocumnet>): Promise<HydratedDocument<TDocumnet> | null> {
        return await this.model.findOne(filter, projection, options);
    }
    async updateOne(filter: RootFilterQuery<TDocumnet>, update: UpdateQuery<TDocumnet>): Promise<UpdateWriteOpResult> {
        return await this.model.updateOne(filter, update);
    }
    async findOneAndUpdate(filter: RootFilterQuery<TDocumnet>, update: UpdateQuery<TDocumnet>, options: QueryOptions<TDocumnet> | null = { new: true }): Promise<HydratedDocument<TDocumnet> | null> {
        return await this.model.findOneAndUpdate(filter, update, options);
    }
    async findOneAndDelete(filter: RootFilterQuery<TDocumnet>, options: QueryOptions<TDocumnet> | null = { new: true }): Promise<HydratedDocument<TDocumnet> | null> {
        return await this.model.findOneAndDelete(filter, options);
    }
    async deleteOne(filter: RootFilterQuery<TDocumnet>): Promise<DeleteResult> {
        return await this.model.deleteOne(filter);
    }
    async deleteMany(filter: RootFilterQuery<TDocumnet>): Promise<DeleteResult> {
        return await this.model.deleteMany(filter);
    }
    async findByIdAndDelete(id: mongoose.Schema.Types.ObjectId, options?: QueryOptions<TDocumnet>) {
        return await this.model.findByIdAndDelete(id, options);
    }
    async findById(id: any, projection?: ProjectionType<TDocumnet> | null, options?: QueryOptions<TDocumnet> | null) {
        return this.model.findById(id, projection, options);
    }
    async getAllPaginated({ filter, query, select, options }: { filter: RootFilterQuery<TDocumnet>, query: { page: number, limit: number }, select?: ProjectionType<TDocumnet>, options?: QueryOptions<TDocumnet> }) {
        let { page, limit } = query
        if (page < 0) page = 1;
        page = page * 1 || 1;
        const skip = (page - 1) * limit;
        const finalOptions = { ...options, page, limit };
        const count = await this.model.countDocuments({ deletedAt: { $exists: false } });
        const docs = await this.model.find(filter, select, finalOptions);
        return { docs, currentPage: page, count, numOfPages: (Math.ceil(count / limit)) };

    }
}