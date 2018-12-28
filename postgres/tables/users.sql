BEGIN TRANSACTION;

CREATE TABLE users (
    id serial PRIMARY KEY,
    name VARCHAR(100),
    email text UNIQUE NOT NULL,
    isAdmin BOOLEAN NOT NULL DEFAULT FALSE,
    joined TIMESTAMP NOT NULL
);

COMMIT;