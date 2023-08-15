import app from "./app";

const main = () => {
    app.listen(app.get('port'));
    console.log(`🚀 Server listening in port ${app.get('port')}`);
};

main();
