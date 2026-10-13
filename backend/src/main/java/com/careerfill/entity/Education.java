package com.careerfill.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "education")
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 200)
    private String college;

    @Column(length = 200)
    private String university;

    @Column(length = 100)
    private String degree;

    @Column(length = 100)
    private String fieldOfStudy;

    @Column(length = 100)
    private String branch;

    @Column(length = 20)
    private String cgpa;

    @Column(length = 10)
    private String graduationYear;

    public Education() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCollege() {
        return college;
    }

    public void setCollege(String college) {
        this.college = college;
    }

    public String getUniversity() {
        return university;
    }

    public void setUniversity(String university) {
        this.university = university;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public String getFieldOfStudy() {
        return fieldOfStudy != null ? fieldOfStudy : branch;
    }

    public void setFieldOfStudy(String fieldOfStudy) {
        this.fieldOfStudy = fieldOfStudy;
        if (this.branch == null) {
            this.branch = fieldOfStudy;
        }
    }

    public String getBranch() {
        return branch != null ? branch : fieldOfStudy;
    }

    public void setBranch(String branch) {
        this.branch = branch;
        if (this.fieldOfStudy == null) {
            this.fieldOfStudy = branch;
        }
    }

    public String getCgpa() {
        return cgpa;
    }

    public void setCgpa(String cgpa) {
        this.cgpa = cgpa;
    }

    public String getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(String graduationYear) {
        this.graduationYear = graduationYear;
    }
}
