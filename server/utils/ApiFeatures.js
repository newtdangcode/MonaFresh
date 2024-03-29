const removeAccents = require("../utils/removeAccents");
module.exports = class {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const { search, ...objQuery } = this.queryString;
        const excludedFields = ["page", "limit", "sort", "fields", "search"];

        excludedFields.forEach((field) => {
            delete objQuery[field];
        });

        const queryString = JSON.parse(
            JSON.stringify(objQuery).replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`),
        );

        const q = search ? removeAccents(search) : "";

        const query = q ? { ...queryString, searchName: { $regex: new RegExp(q, "i") } } : { ...queryString };

        this.query = this.query.find(query);
        return this;
    }
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query = this.query.sort(sortBy);
        }
        return this;
    }
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select("-__v");
        }
        return this;
    }
    async paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        const totalCount = await this.query.model.countDocuments(this.query.getFilter());

        const totalPages = Math.ceil(totalCount / limit);

        return {
            query: this.query,
            totalPages,
            currentPage: page,
        };
    }
};
