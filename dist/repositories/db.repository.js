"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbRepository = void 0;
class DbRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        return await this.model.create(data);
    }
    async find(filter, select, options) {
        return await this.model.find(filter, select, options);
    }
    async findOne(filter, projection, options) {
        return await this.model.findOne(filter, projection, options);
    }
    async updateOne(filter, update) {
        return await this.model.updateOne(filter, update);
    }
    async findOneAndUpdate(filter, update, options = { new: true }) {
        return await this.model.findOneAndUpdate(filter, update, options);
    }
    async findOneAndDelete(filter, options = { new: true }) {
        return await this.model.findOneAndDelete(filter, options);
    }
    async deleteOne(filter) {
        return await this.model.deleteOne(filter);
    }
    async deleteMany(filter) {
        return await this.model.deleteMany(filter);
    }
    async findByIdAndDelete(id, options) {
        return await this.model.findByIdAndDelete(id, options);
    }
    async findById(id, projection, options) {
        return this.model.findById(id, projection, options);
    }
    async getAllPaginated({ filter, query, select, options }) {
        let { page, limit } = query;
        if (page < 0)
            page = 1;
        page = page * 1 || 1;
        const skip = (page - 1) * limit;
        const finalOptions = { ...options, page, limit };
        const count = await this.model.countDocuments({ deletedAt: { $exists: false } });
        const docs = await this.model.find(filter, select, finalOptions);
        return { docs, currentPage: page, count, numOfPages: (Math.ceil(count / limit)) };
    }
}
exports.DbRepository = DbRepository;
