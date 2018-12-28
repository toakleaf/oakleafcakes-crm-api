FROM node:11.6

WORKDIR /usr/src/oakleafcakes-crm-api

COPY ./ ./

RUN npm install

RUN npm i -g nodemon

CMD ["/bin/bash"]

