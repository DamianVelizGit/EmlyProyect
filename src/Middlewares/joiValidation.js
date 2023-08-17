const validation = (schema) => {
    return async (req, res, next) => {

        try {
            await schema.validateAsync(req.body, { abortEarly: false });
            next();
        }
        catch (err) {
            res.status(400).send(err.message);
        }

    }
}

module.exports = validation


