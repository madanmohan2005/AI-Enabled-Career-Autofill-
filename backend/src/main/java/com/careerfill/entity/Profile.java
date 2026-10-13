package com.careerfill.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ── Identity ─────────────────────────────────────────────────────────────
    @Column(length = 150)
    private String fullName;

    @Column(length = 80)
    private String firstName;

    @Column(length = 80)
    private String lastName;

    @Column(length = 80)
    private String middleName;

    @Column(length = 30)
    private String phone;

    @Column(length = 30)
    private String alternatePhone;

    @Column(length = 30)
    private String dob;

    @Column(length = 30)
    private String gender;

    @Column(length = 60)
    private String nationality;

    @Column(length = 200)
    private String languages;

    @Column(length = 30)
    private String maritalStatus;

    // ── Location ─────────────────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(length = 20)
    private String pinCode;

    // ── Professional ─────────────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(length = 150)
    private String jobTitle;

    @Column(length = 150)
    private String currentRole;

    @Column(length = 150)
    private String desiredRole;

    @Column(length = 10)
    private String totalYearsExperience;

    @Column(length = 150)
    private String currentCompany;

    @Column(length = 50)
    private String currentCTC;

    // ── Links ────────────────────────────────────────────────────────────────
    @Column(length = 255)
    private String linkedinUrl;

    @Column(length = 255)
    private String githubUrl;

    @Column(length = 255)
    private String portfolioUrl;

    // ── Secondary Education ──────────────────────────────────────────────────
    @Column(length = 200)
    private String tenthSchool;

    @Column(length = 60)
    private String tenthBoard;

    @Column(length = 20)
    private String tenthPercentage;

    @Column(length = 10)
    private String tenthYear;

    @Column(length = 200)
    private String twelfthSchool;

    @Column(length = 60)
    private String twelfthBoard;

    @Column(length = 20)
    private String twelfthPercentage;

    @Column(length = 10)
    private String twelfthYear;

    @Column(length = 60)
    private String twelfthStream;

    // ── Documents (sensitive) ────────────────────────────────────────────────
    @Column(length = 30)
    private String panNumber;

    @Column(length = 30)
    private String passportNumber;

    @Column(length = 30)
    private String drivingLicense;

    // ── Declarations ─────────────────────────────────────────────────────────
    @Column(length = 200)
    private String workAuth;

    @Column(length = 100)
    private String noticePeriod;

    @Column(length = 50)
    private String expectedSalary;

    @Column(length = 50)
    private String currentSalary;

    @Column(length = 100)
    private String veteranStatus;

    @Column(length = 100)
    private String disabilityStatus;

    // ── Constructors ─────────────────────────────────────────────────────────
    public Profile() {}

    // ── Getters / Setters ────────────────────────────────────────────────────
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }

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

    public String getLinkedinUrl() { return linkedinUrl; }
    public void setLinkedinUrl(String linkedinUrl) { this.linkedinUrl = linkedinUrl; }

    public String getGithubUrl() { return githubUrl; }
    public void setGithubUrl(String githubUrl) { this.githubUrl = githubUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    // Secondary education
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

    // Documents
    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getPassportNumber() { return passportNumber; }
    public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }

    public String getDrivingLicense() { return drivingLicense; }
    public void setDrivingLicense(String drivingLicense) { this.drivingLicense = drivingLicense; }

    // Declarations
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
