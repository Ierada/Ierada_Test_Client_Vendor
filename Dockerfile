#using  node:18-alpine as builder 
FROM  node:18-alpine AS builder
# Setting WORKDIR
WORKDIR /app
#Copying pkg.json
COPY package.json ./
#Installing Dependencis
RUN npm install --legacy-peer-deps
#Copying  all files
COPY . .
#Building the code 
RUN  npm  run build


#Serving  with Nginx:alpine
FROM nginx:alpine
#Copying    main code from builder
COPY --from=builder /app/dist  /usr/share/nginx/html

#copying default.conf from the host
COPY default.conf  /etc/nginx/conf.d/default.conf

#Exposing port for container
EXPOSE 80

#Running CMD for pid binding
CMD ["nginx", "-g", "daemon off;"]

