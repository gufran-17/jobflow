pipeline {

    // Run the pipeline on any available Jenkins agent
    agent any

    stages {

        // =====================================================
        // 1. CHECKOUT
        // =====================================================
        stage('Checkout') {
            steps {

                // Get the latest application code from the
                // Git repository configured in Jenkins
                checkout scm
            }
        }


        // =====================================================
        // 2. BUILD
        // =====================================================
        stage('Build') {
            steps {

                // Build the backend and frontend Docker images
                // using the docker-compose.yml configuration
                sh 'docker compose build'
            }
        }


        // =====================================================
        // 3. DEPLOY
        // =====================================================
        stage('Deploy') {
            steps {

                // Start MySQL, backend, and frontend containers
                // in detached mode
                sh 'docker compose up -d'
            }
        }


        // =====================================================
        // 4. VERIFY
        // =====================================================
        stage('Verify') {
            steps {

                // Check the status of all Docker Compose services
                // and verify that the containers are running
                sh 'docker compose ps'
            }
        }
    }


    // =========================================================
    // POST ACTIONS
    // =========================================================
    post {

        // Execute when all pipeline stages complete successfully
        success {
            echo 'JobFlow application deployed successfully!'
            echo 'Application URL: http://13.201.44.7:5173'
        }

        // Execute when any pipeline stage fails
        failure {
            echo 'JobFlow pipeline failed!'
        }

        // Execute after every pipeline run
        always {
            echo 'Pipeline execution completed.'
        }
    }
}