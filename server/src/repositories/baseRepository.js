export function createRepository(Model) {
  return {
    find(filter = {}, options = {}) {
      let query = Model.find(filter);
      if (options.populate) query = query.populate(options.populate);
      if (options.sort) query = query.sort(options.sort);
      if (options.limit) query = query.limit(options.limit);
      return query;
    },
    findById(id, options = {}) {
      let query = Model.findById(id);
      if (options.populate) query = query.populate(options.populate);
      return query;
    },
    findOne(filter, options = {}) {
      let query = Model.findOne(filter);
      if (options.populate) query = query.populate(options.populate);
      if (options.select) query = query.select(options.select);
      return query;
    },
    create(data) {
      return Model.create(data);
    },
    updateById(id, data, options = {}) {
      return Model.findByIdAndUpdate(id, data, { returnDocument: "after", runValidators: true, ...options });
    },
    deleteById(id) {
      return Model.findByIdAndDelete(id);
    },
    deleteMany(filter) {
      return Model.deleteMany(filter);
    },
  };
}
