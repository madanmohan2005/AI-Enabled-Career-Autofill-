package com.careerfill.dto;

import java.util.List;

public class ProfileDto {

    // ── Identity ─────────────────────────────────────────────────────────────
    private String fullName;
    private String firstName;
    private String lastName;
    private String middleName;
    private String email;
    private String phone;
    private String alternatePhone;
    private String dob;
    private String gender;
    private String nationality;
    private String languages;
    private String maritalStatus;

    // ── Location ─────────────────────────────────────────────────────────────
    private String address;
    private String city;
    private String state;
    private String country;
    private String pinCode;

    // ── Professional ─────────────────────────────────────────────────────────
    private String summary;
    private String jobTitle;
    private String currentRole;
    private String desiredRole;
    private String totalYearsExperience;
    private String currentCompany;
    private String currentCTC;

    // ── Links ────────────────────────────────────────────────────────────────
    private String linkedinUrl;
    private String githubUrl;
    private String portfolioUrl;

    // ── Education ────────────────────────────────────────────────────────────
    private List<EducationDto> education;
    private SecondaryEducationDto secondaryEducation;

    // ── Skills / Projects / Experience ────────────────────────────────────────
    private List<String> skills;
    private List<ProjectDto> projects;
    private List<ExperienceDto> experience;

    // ── Documents ────────────────────────────────────────────────────────────
    private String panNumber;
    private String passportNumber;
    private String drivingLicense;

    // ── Declarations ─────────────────────────────────────────────────────────
    private DeclarationsDto declarations;

    public ProfileDto() {}

    // ──────────────────────── Inner DTOs ────────────────────────────────────

    public static class EducationDto {
        private String college;
        private String university;
        private String degree;
        private String fieldOfStudy;
        private String branch;
        private String cgpa;
        private String graduationYear;

        public EducationDto() {}

        public String getCollege() { return college; }
        public void setCollege(String college) { this.college = college; }
        public String getUniversity() { return university; }
        public void setUniversity(String university) { this.university = university; }
        public String getDegree() { return degree; }
        public void setDegree(String degree) { this.degree = degree; }
        public String getFieldOfStudy() { return fieldOfStudy != null ? fieldOfStudy : branch; }
        public void setFieldOfStudy(String fieldOfStudy) {
            this.fieldOfStudy = fieldOfStudy;
            if (this.branch == null) this.branch = fieldOfStudy;
        }
        public String getBranch() { return branch != null ? branch : fieldOfStudy; }
        public void setBranch(String branch) {
            this.branch = branch;
            if (this.fieldOfStudy == null) this.fieldOfStudy = branch;
        }
        public String getCgpa() { return cgpa; }
        public void setCgpa(String cgpa) { this.cgpa = cgpa; }
        public String getGraduationYear() { return graduationYear; }
        public void setGraduationYear(String graduationYear) { this.graduationYear = graduationYear; }
    }

    public static class SecondaryEducationDto {
        private String tenthSchool;
        private String tenthBoard;
        private String tenthPercentage;
        private String tenthYear;
        private String twelfthSchool;
        private String twelfthBoard;
        private String twelfthPercentage;
        private String twelfthYear;
        private String twelfthStream;

        public SecondaryEducationDto() {}

        public String getTenthSchool() { return tenthSchool; }
        public void setTenthSchool(String tenthSchool) { this.tenthSchool = tenthSchool; }
        public String getTenthBoard() { return tenthBoard; }
        public void setTenthBoard(String tenthBoard) { this.tenthBoard = tenthBoard; }
        public String getTenthPercentage() { return tenthPercentage; }
        public void setTenthPercentage(String tenthPercentage) { this.tenthPercentage = tenthPercentage; }
        public String getTenthYear() { return tenthYear; }
        public void setTenthYear(String tenthYear) { this.tenthYear = tenthYear; }
        public String getTwelfthSchool() { return twelfthSchool; }
        public void setTwelfthSchool(String twelfthSchool) { this.twelfthSchool = twelfthSchool; }
        public String getTwelfthBoard() { return twelfthBoard; }
        public void setTwelfthBoard(String twelfthBoard) { this.twelfthBoard = twelfthBoard; }
        public String getTwelfthPercentage() { return twelfthPercentage; }
        public void setTwelfthPercentage(String twelfthPercentage) { this.twelfthPercentage = twelfthPercentage; }
        public String getTwelfthYear() { return twelfthYear; }
        public void setTwelfthYear(String twelfthYear) { this.twelfthYear = twelfthYear; }
        public String getTwelfthStream() { return twelfthStream; }
        public void setTwelfthStream(String twelfthStream) { this.twelfthStream = twelfthStream; }
    }

    public static class DeclarationsDto {
        private String workAuth;
        private String noticePeriod;
        private String expectedSalary;
        private String currentSalary;
        private String veteranStatus;
        private String disabilityStatus;

        public DeclarationsDto() {}

        public String getWorkAuth() { return workAuth; }
        public void setWorkAuth(String workAuth) { this.workAuth = workAuth; }
        public String getNoticePeriod() { return noticePeriod; }
        public void setNoticePeriod(String noticePeriod) { this.noticePeriod = noticePeriod; }
        public String getExpectedSalary() { return expectedSalary; }
        public void setExpectedSalary(String expectedSalary) { this.expectedSalary = expectedSalary; }
        public String getCurrentSalary() { return currentSalary; }
        public void setCurrentSalary(String currentSalary) { this.currentSalary = currentSalary; }
        public String getVeteranStatus() { return veteranStatus; }
        public void setVeteranStatus(String veteranStatus) { this.veteranStatus = veteranStatus; }
        public String getDisabilityStatus() { return disabilityStatus; }
        public void setDisabilityStatus(String disabilityStatus) { this.disabilityStatus = disabilityStatus; }
    }

    public static class ProjectDto {
        private String name;
        private String description;
        private String technologies;
        private String githubUrl;

        public ProjectDto() {}

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getTechnologies() { return technologies; }
        public void setTechnologies(String technologies) { this.technologies = technologies; }
        public String getGithubUrl() { return githubUrl; }
        public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
    }

    public static class ExperienceDto {
        private String company;
        private String role;
        private String startDate;
        private String endDate;
        private String description;

        public ExperienceDto() {}

        public String getCompany() { return company; }
        public void setCompany(String company) { this.company = company; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    // ──────────────────────── Root Getters/Setters ──────────────────────────

    // Identity
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }
    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }
    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    // Location
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    // Professional
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getCurrentRole() { return currentRole; }
    public void setCurrentRole(String currentRole) { this.currentRole = currentRole; }
    public String getDesiredRole() { return desiredRole; }
    public void setDesiredRole(String desiredRole) { this.desiredRole = desiredRole; }
    public String getTotalYearsExperience() { return totalYearsExperience; }
    public void setTotalYearsExperience(String totalYearsExperience) { this.totalYearsExperience = totalYearsExperience; }
    public String getCurrentCompany() { return currentCompany; }
    public void setCurrentCompany(String currentCompany) { this.currentCompany = currentCompany; }
    public String getCurrentCTC() { return currentCTC; }
    public void setCurrentCTC(String currentCTC) { this.currentCTC = currentCTC; }

    // Links
    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }
    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }
    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    // Education
    public List<EducationDto> getEducation() { return education; }
    public void setEducation(List<EducationDto> education) { this.education = education; }
    public SecondaryEducationDto getSecondaryEducation() { return secondaryEducation; }
    public void setSecondaryEducation(SecondaryEducationDto secondaryEducation) { this.secondaryEducation = secondaryEducation; }

    // Skills / Projects / Experience
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills; }
    public List<ProjectDto> getProjects() { return projects; }
    public void setProjects(List<ProjectDto> projects) { this.projects = projects; }
    public List<ExperienceDto> getExperience() { return experience; }
    public void setExperience(List<ExperienceDto> experience) { this.experience = experience; }

    // Documents
    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
    public String getPassportNumber() { return passportNumber; }
    public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }
    public String getDrivingLicense() { return drivingLicense; }
    public void setDrivingLicense(String drivingLicense) { this.drivingLicense = drivingLicense; }

    // Declarations
    public DeclarationsDto getDeclarations() { return declarations; }
    public void setDeclarations(DeclarationsDto declarations) { this.declarations = declarations; }
}
