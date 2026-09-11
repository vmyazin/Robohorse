import app from './app.js';

const server = app.listen(process.env.PORT || 4270, () => {
    console.log(`Server listening on port ${server.address().port}`);
});

export default app;
