pipeline {

    // Run the pipeline on any available Jenkins agent
    agent any

    stages {

        // =====================================================
        // 1. CHECKOUT
        // =====================================================
        stage('Checkout') {
            steps {

                // Checkout the source code from the configured Git repository
                checkout scm
            }
        }

        // =====================================================
        // 2. BUILD
        // =====================================================
        stage('Build') {
            steps {

                // Build the Docker images defined in docker-compose.yml
                sh 'docker compose build'
            }
        }

        // =====================================================
        // 3. VALIDATE
        // =====================================================
        stage('Validate') {
            steps {

                // Validate the Docker Compose configuration
                sh 'docker compose config'
            }
        }

        // =====================================================
        // 4. TEST
        // =====================================================
        stage('Test') {
            steps {
             echo 'Running JobFlow tests...'
                sh 'exit 1'
            }
        }
    }

    // =========================================================
    // POST ACTIONS
    // =========================================================
    post {

        // Execute when all stages complete successfully
        success {
            echo 'JobFlow CI Pipeline completed successfully!'
        }

        // Execute when any stage fails
        failure {
            echo 'JobFlow CI Pipeline failed!'
        }

        // Execute regardless of pipeline result
        always {
            echo 'Pipeline execution completed.'
        }
    }
}