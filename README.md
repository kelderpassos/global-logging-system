
# Global Logging System

This project is a template of a bigger and more complex logging system to showcase several capabilities and structures that could be implemented in a production environment. It's composed by a basic api with a single route to fetch data from DynamoDB. Intentionally this process will result in error that will the catch by the class called Logger with methods responsible for structuring a comprehensible error message, send them to AWS Cloudwatch and AWS SQS.




  
## Technologies
Node with Typescript, Winston (library), AWS SDK for Javascript;