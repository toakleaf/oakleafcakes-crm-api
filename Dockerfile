FROM node:12.2

WORKDIR /usr/src/oakleafcakes-crm-api

COPY ./ ./

RUN npm install

RUN npm i -g nodemon jest knex

# RUN knex migrate:latest

# RUN knex seed:run

CMD ["/bin/bash"]

